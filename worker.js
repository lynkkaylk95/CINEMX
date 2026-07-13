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

function getWeeklyCounterKey(slug, date = new Date()) {
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
  return `movie-week:${weekYear}-W${String(week).padStart(2, "0")}:${slug}`;
}

async function handleMovieViews(request, env, slug) {
  if (!isValidSlug(slug)) {
    return jsonResponse({ ok: false, error: "invalid_movie", views: 0 }, { status: 400 });
  }

  const viewsStore = env.CINEMAX_VIEWS;
  if (!viewsStore) {
    return jsonResponse({ ok: true, configured: false, views: 0, weeklyViews: 0, counted: false });
  }

  const counterKey = `movie:${slug}`;
  const weeklyCounterKey = getWeeklyCounterKey(slug);
  const cookies = parseCookies(request);
  const visitorId = cookies.cmx_vid || createVisitorId();
  const userAgent = request.headers.get("User-Agent") || "";
  const visitorHash = await sha256(`${slug}|${visitorId}|${getClientIp(request)}|${userAgent}`);
  const throttleKey = `movie-view-lock:${slug}:${visitorHash}`;
  const headers = new Headers({
    "Set-Cookie": `cmx_vid=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure; HttpOnly`
  });

  let realViews = Number(await viewsStore.get(counterKey) || 0);
  let weeklyViews = Number(await viewsStore.get(weeklyCounterKey) || 0);
  let counted = false;

  if (request.method === "POST") {
    const isLocked = await viewsStore.get(throttleKey);
    if (!isLocked) {
      realViews += 1;
      weeklyViews += 1;
      counted = true;
      await Promise.all([
        viewsStore.put(counterKey, String(realViews)),
        viewsStore.put(weeklyCounterKey, String(weeklyViews), { expirationTtl: 21 * 24 * 60 * 60 }),
        viewsStore.put(throttleKey, "1", { expirationTtl: 30 * 60 })
      ]);
    }
  }

  return jsonResponse({
    ok: true,
    configured: true,
    views: realViews,
    weeklyViews,
    counted
  }, { headers });
}

async function handleMovieViewsBatch(request, env) {
  const viewsStore = env.CINEMAX_VIEWS;
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug, index, list) => isValidSlug(slug) && list.indexOf(slug) === index)
    .slice(0, 80);

  if (!viewsStore || !slugs.length) {
    return jsonResponse({
      ok: true,
      configured: Boolean(viewsStore),
      views: Object.fromEntries(slugs.map((slug) => [slug, 0])),
      weeklyViews: Object.fromEntries(slugs.map((slug) => [slug, 0]))
    });
  }

  const entries = await Promise.all(slugs.map(async (slug) => {
    const [views, weeklyViews] = await Promise.all([
      viewsStore.get(`movie:${slug}`),
      viewsStore.get(getWeeklyCounterKey(slug))
    ]);
    return [slug, Number(views || 0), Number(weeklyViews || 0)];
  }));

  return jsonResponse({
    ok: true,
    configured: true,
    views: Object.fromEntries(entries.map(([slug, views]) => [slug, views])),
    weeklyViews: Object.fromEntries(entries.map(([slug, , weeklyViews]) => [slug, weeklyViews]))
  }, {
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

async function serveMovieShell(request, env, movie) {
  const movieUrl = new URL("/movie.html", request.url);
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
  const legalPages = ["about.html", "privacy.html", "terms.html", "dmca.html", "contact.html"];
  const urls = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0" },
    ...legalPages.map((page) => ({ loc: `${SITE_ORIGIN}/${page}`, priority: "0.6" })),
    ...years.map((year) => ({ loc: `${SITE_ORIGIN}/ano/${year}`, priority: "0.8" })),
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

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const moviePathMatch = url.pathname.match(/^\/pelicula\/([^/]+)\/?$/);
    if (moviePathMatch) {
      const slug = decodeURIComponent(moviePathMatch[1]);
      const movies = await loadMovies(request, env);
      const movie = movies.find((item) => getMovieSlug(item) === slug);
      return serveMovieShell(request, env, movie);
    }

    if (/^\/ano\/\d{4}\/?$/.test(url.pathname)) {
      return serveIndexShell(request, env);
    }

    return assetResponse;
  }
};
