function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMovieSlug(movie) {
  return movie && (movie.slug || slugify(movie.title) || `pelicula-${movie.id || ""}`);
}

const OLD_HOST = "cinemx.moviemx.workers.dev";
const SITE_ORIGIN = "https://cinemaxmx.com";

function redirectOldDomain(url) {
  if (url.hostname !== OLD_HOST) return null;
  const target = new URL(`${url.pathname}${url.search}`, SITE_ORIGIN);
  return Response.redirect(target.toString(), 301);
}

function getYouTubeId(value) {
  const raw = String(value || "").trim();
  const patterns = [
    /ytimg\.com\/vi\/([A-Za-z0-9_-]{6,})\//,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) return match[1];
  }
  const directId = raw.split(/[?&#]/)[0].trim().match(/^([A-Za-z0-9_-]{6,})$/);
  return directId ? directId[1] : "";
}

function getThumbnailUrl(movie) {
  const thumb = String((movie && movie.thumb) || "").trim();
  const videoId = getYouTubeId(thumb) || getYouTubeId(movie && movie.yt);
  if (thumb && !/(?:youtube\.com|youtu\.be|ytimg\.com|^[A-Za-z0-9_-]{6,})/.test(thumb)) {
    return thumb;
  }
  return videoId ? `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg` : thumb;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value, max = 160) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3).trim()}...` : text;
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json;charset=UTF-8");
  headers.set("cache-control", "no-store");
  headers.set("access-control-allow-origin", "*");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  return Object.fromEntries(cookieHeader.split(";").map((part) => {
    const [name, ...rest] = part.trim().split("=");
    return [name, rest.join("=")];
  }).filter(([name]) => name));
}

function isValidSlug(value) {
  return /^[a-z0-9][a-z0-9-]{0,120}$/.test(String(value || ""));
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "";
}

function createVisitorId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getWeeklyPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localDate = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  const day = localDate.getUTCDay() || 7;
  localDate.setUTCDate(localDate.getUTCDate() + 4 - day);
  const weekYear = localDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((localDate - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export class MovieViewCounter {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS movie_views (
        slug TEXT PRIMARY KEY,
        total_views INTEGER NOT NULL DEFAULT 0,
        week_key TEXT NOT NULL,
        weekly_views INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS visitor_locks (
        slug TEXT NOT NULL,
        visitor_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (slug, visitor_hash)
      );
    `);
  }

  getViews(slug, weekKey) {
    const row = this.sql.exec(
      "SELECT total_views, week_key, weekly_views FROM movie_views WHERE slug = ?",
      slug
    ).toArray()[0];

    return {
      views: Number(row?.total_views || 0),
      weeklyViews: row?.week_key === weekKey ? Number(row.weekly_views || 0) : 0
    };
  }

  increment(slug, weekKey, visitorHash) {
    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;

    return this.state.storage.transactionSync(() => {
      this.sql.exec("DELETE FROM visitor_locks WHERE slug = ? AND expires_at <= ?", slug, now);
      const lock = this.sql.exec(
        "SELECT 1 AS locked FROM visitor_locks WHERE slug = ? AND visitor_hash = ?",
        slug,
        visitorHash
      ).toArray()[0];

      if (lock) {
        return { ...this.getViews(slug, weekKey), counted: false };
      }

      this.sql.exec(
        `INSERT INTO visitor_locks (slug, visitor_hash, expires_at) VALUES (?, ?, ?)
         ON CONFLICT (slug, visitor_hash) DO UPDATE SET expires_at = excluded.expires_at`,
        slug,
        visitorHash,
        expiresAt
      );

      const row = this.sql.exec(
        `INSERT INTO movie_views (slug, total_views, week_key, weekly_views)
         VALUES (?, 1, ?, 1)
         ON CONFLICT (slug) DO UPDATE SET
           total_views = movie_views.total_views + 1,
           week_key = excluded.week_key,
           weekly_views = CASE
             WHEN movie_views.week_key = excluded.week_key THEN movie_views.weekly_views + 1
             ELSE 1
           END
         RETURNING total_views, weekly_views`,
        slug,
        weekKey
      ).one();

      return {
        views: Number(row.total_views),
        weeklyViews: Number(row.weekly_views),
        counted: true
      };
    });
  }

  getBatch(slugs, weekKey) {
    const views = Object.fromEntries(slugs.map((slug) => [slug, 0]));
    const weeklyViews = Object.fromEntries(slugs.map((slug) => [slug, 0]));
    if (!slugs.length) return { views, weeklyViews };

    const placeholders = slugs.map(() => "?").join(",");
    const rows = this.sql.exec(
      `SELECT slug, total_views, week_key, weekly_views
       FROM movie_views WHERE slug IN (${placeholders})`,
      ...slugs
    ).toArray();

    for (const row of rows) {
      views[row.slug] = Number(row.total_views || 0);
      weeklyViews[row.slug] = row.week_key === weekKey ? Number(row.weekly_views || 0) : 0;
    }

    return { views, weeklyViews };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const weekKey = request.headers.get("X-Week-Key") || getWeeklyPeriod();

    if (url.pathname === "/batch" && request.method === "GET") {
      const slugs = (url.searchParams.get("slugs") || "").split(",").filter(isValidSlug).slice(0, 80);
      return jsonResponse({ ok: true, ...this.getBatch(slugs, weekKey) });
    }

    const match = url.pathname.match(/^\/view\/([^/]+)$/);
    const slug = match ? decodeURIComponent(match[1]) : "";
    if (!isValidSlug(slug) || (request.method !== "GET" && request.method !== "POST")) {
      return jsonResponse({ ok: false, error: "invalid_request" }, { status: 400 });
    }

    if (request.method === "POST") {
      const visitorHash = request.headers.get("X-Visitor-Hash") || "";
      if (!visitorHash) return jsonResponse({ ok: false, error: "missing_visitor" }, { status: 400 });
      return jsonResponse({ ok: true, configured: true, ...this.increment(slug, weekKey, visitorHash) });
    }

    return jsonResponse({
      ok: true,
      configured: true,
      ...this.getViews(slug, weekKey),
      counted: false
    });
  }
}

function getViewCounterStub(env) {
  if (!env.CINEMAX_VIEW_COUNTER) return null;
  const id = env.CINEMAX_VIEW_COUNTER.idFromName("movie-views");
  return env.CINEMAX_VIEW_COUNTER.get(id);
}

async function handleMovieViews(request, env, slug) {
  if (!isValidSlug(slug)) {
    return jsonResponse({ ok: false, error: "invalid_movie", views: 0 }, { status: 400 });
  }

  const counter = getViewCounterStub(env);
  if (!counter) {
    return jsonResponse({ ok: true, configured: false, views: 0, weeklyViews: 0, counted: false });
  }

  const cookies = parseCookies(request);
  const visitorId = cookies.cmx_vid || createVisitorId();
  const userAgent = request.headers.get("User-Agent") || "";
  const visitorHash = await sha256(`${slug}|${visitorId}|${getClientIp(request)}|${userAgent}`);
  const headers = new Headers({
    "Set-Cookie": `cmx_vid=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure; HttpOnly`
  });

  const durableRequest = new Request(`https://view-counter/view/${encodeURIComponent(slug)}`, {
    method: request.method,
    headers: {
      "X-Visitor-Hash": visitorHash,
      "X-Week-Key": getWeeklyPeriod()
    }
  });
  const response = await counter.fetch(durableRequest);
  const data = await response.json();
  return jsonResponse(data, { status: response.status, headers });
}

async function handleMovieViewsBatch(request, env) {
  const counter = getViewCounterStub(env);
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug, index, list) => isValidSlug(slug) && list.indexOf(slug) === index)
    .slice(0, 80);

  if (!counter || !slugs.length) {
    return jsonResponse({
      ok: true,
      configured: Boolean(counter),
      views: Object.fromEntries(slugs.map((slug) => [slug, 0])),
      weeklyViews: Object.fromEntries(slugs.map((slug) => [slug, 0]))
    });
  }

  const durableRequest = new Request(`https://view-counter/batch?slugs=${encodeURIComponent(slugs.join(","))}`, {
    headers: { "X-Week-Key": getWeeklyPeriod() }
  });
  const response = await counter.fetch(durableRequest);
  const data = await response.json();
  return jsonResponse({ ...data, configured: true }, {
    status: response.status,
    headers: {
      "cache-control": "public, max-age=60"
    }
  });
}

async function loadMovies(request, env) {
  const moviesUrl = new URL("/js/movies.js", request.url);
  const response = await env.ASSETS.fetch(new Request(moviesUrl, { method: "GET" }));
  if (!response.ok) return [];

  const source = await response.text();
  const match = source.match(/const\s+MOVIES\s*=\s*(\[[\s\S]*?\]);?\s*$/);
  if (!match) return [];

  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return [];
  }
}

function injectMovieMeta(html, movie, request) {
  if (!movie) return html;

  const slug = getMovieSlug(movie);
  const canonicalUrl = `${SITE_ORIGIN}/pelicula/${encodeURIComponent(slug)}`;
  const title = `${movie.title || "Película"} - CineMax MX`;
  const description = truncate(movie.desc || "Mira películas completas y series en español latino en CineMax MX.");
  const image = getThumbnailUrl(movie) || "https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Movie",
        name: movie.title || "Película",
        description,
        image,
        url: canonicalUrl
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Películas", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 3, name: movie.title || "Película", item: canonicalUrl }
        ]
      }
    ]
  };

  return html
    .replace(/<meta name="description" id="meta-desc" content="[^"]*">/, `<meta name="description" id="meta-desc" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical" id="canonical-link" href="[^"]*">/, `<link rel="canonical" id="canonical-link" href="${escapeHtml(canonicalUrl)}">`)
    .replace(/<meta property="og:title" id="og-title" content="[^"]*">/, `<meta property="og:title" id="og-title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:description" id="og-desc" content="[^"]*">/, `<meta property="og:description" id="og-desc" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:url" id="og-url" content="[^"]*">/, `<meta property="og:url" id="og-url" content="${escapeHtml(canonicalUrl)}">`)
    .replace(/<meta property="og:image" id="og-image" content="[^"]*">/, `<meta property="og:image" id="og-image" content="${escapeHtml(image)}">`)
    .replace(/<meta name="twitter:title" id="twitter-title" content="[^"]*">/, `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(title)}">`)
    .replace(/<meta name="twitter:description" id="twitter-desc" content="[^"]*">/, `<meta name="twitter:description" id="twitter-desc" content="${escapeHtml(description)}">`)
    .replace(/<meta name="twitter:image" id="twitter-image" content="[^"]*">/, `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(image)}">`)
    .replace(/<title id="page-title">[\s\S]*?<\/title>/, `<title id="page-title">${escapeHtml(title)}</title>`)
    .replace(/<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="structured-data">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`);
}

async function serveMovieShell(request, env, movie, assetPath = "/movie.html") {
  const movieUrl = new URL(assetPath, request.url);
  const response = await env.ASSETS.fetch(new Request(movieUrl, { method: "GET", headers: request.headers }));
  if (!response.ok) return response;

  const html = injectMovieMeta(await response.text(), movie, request);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "no-cache, no-store, must-revalidate"
    }
  });
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemap(request, movies) {
  const years = [...new Set(movies.map((movie) => Number(movie.year)).filter(Boolean))].sort((a, b) => b - a);
  const genres = [...new Set(movies.flatMap((movie) => Array.isArray(movie.genres) ? movie.genres : [movie.genre]).filter(Boolean).map(slugify))];
  const legalPages = ["about.html", "privacy.html", "terms.html", "dmca.html", "contact.html"];
  const urls = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0" },
    ...legalPages.map((page) => ({ loc: `${SITE_ORIGIN}/${page}`, priority: "0.6" })),
    ...years.map((year) => ({ loc: `${SITE_ORIGIN}/ano/${year}`, priority: "0.8" })),
    ...genres.map((genre) => ({ loc: `${SITE_ORIGIN}/genero/${encodeURIComponent(genre)}`, priority: "0.8" })),
    ...movies.map((movie) => ({ loc: `${SITE_ORIGIN}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`, priority: "0.9" }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((item) => `  <url>\n    <loc>${xmlEscape(item.loc)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml;charset=UTF-8",
      "cache-control": "no-cache, must-revalidate"
    }
  });
}

async function serveIndexShell(request, env) {
  const indexUrl = new URL("/index.html", request.url);
  return env.ASSETS.fetch(new Request(indexUrl, { method: "GET", headers: request.headers }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const oldDomainRedirect = redirectOldDomain(url);
    if (oldDomainRedirect) return oldDomainRedirect;

    if ((url.pathname === "/api/views" || url.pathname === "/api/view-counts") && request.method === "GET") {
      return handleMovieViewsBatch(request, env);
    }

    const viewsMatch = url.pathname.match(/^\/api\/views\/([^/]+)$/);
    if (viewsMatch && (request.method === "GET" || request.method === "POST")) {
      return handleMovieViews(request, env, decodeURIComponent(viewsMatch[1]));
    }

    if (url.pathname === "/sitemap.xml") {
      return buildSitemap(request, await loadMovies(request, env));
    }

    if (url.pathname === "/movie" || url.pathname === "/movie.html") {
      const id = url.searchParams.get("id");
      if (id) {
        const movies = await loadMovies(request, env);
        const movie = movies.find((item) => Number(item.id) === Number(id));
        const slug = getMovieSlug(movie);
        if (slug) {
          return Response.redirect(`${SITE_ORIGIN}/pelicula/${encodeURIComponent(slug)}`, 301);
        }
      }
    }

    const moviePathMatch = url.pathname.match(/^\/pelicula\/([^/]+)\/?$/);
    if (moviePathMatch) {
      const slug = decodeURIComponent(moviePathMatch[1]);
      const movies = await loadMovies(request, env);
      const movie = movies.find((item) => getMovieSlug(item) === slug);
      return serveMovieShell(request, env, movie, "/detail.html");
    }

    const watchPathMatch = url.pathname.match(/^\/ver\/([^/]+)\/?$/);
    if (watchPathMatch) {
      const slug = decodeURIComponent(watchPathMatch[1]);
      const movies = await loadMovies(request, env);
      const movie = movies.find((item) => getMovieSlug(item) === slug);
      return serveMovieShell(request, env, movie, "/movie.html");
    }

    if (/^\/ano\/\d{4}\/?$/.test(url.pathname) || /^\/genero\/[^/]+\/?$/.test(url.pathname) || /^\/buscar\/?$/.test(url.pathname)) {
      const catalogUrl = new URL("/catalog.html", request.url);
      return env.ASSETS.fetch(new Request(catalogUrl, { method: "GET", headers: request.headers }));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return assetResponse;
  }
};
