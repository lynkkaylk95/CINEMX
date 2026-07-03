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

  const url = new URL(request.url);
  const slug = getMovieSlug(movie);
  const canonicalUrl = `${url.origin}/pelicula/${encodeURIComponent(slug)}`;
  const title = `${movie.title || "Película"} - CineMax MX`;
  const description = truncate(movie.desc || "Mira películas completas y series en español latino en CineMax MX.");
  const image = getThumbnailUrl(movie) || "https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg";

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
    .replace(/<title id="page-title">[\s\S]*?<\/title>/, `<title id="page-title">${escapeHtml(title)}</title>`);
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
  const origin = new URL(request.url).origin;
  const years = [...new Set(movies.map((movie) => Number(movie.year)).filter(Boolean))].sort((a, b) => b - a);
  const urls = [
    { loc: `${origin}/`, priority: "1.0" },
    ...years.map((year) => ({ loc: `${origin}/ano/${year}`, priority: "0.8" })),
    ...movies.map((movie) => ({ loc: `${origin}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`, priority: "0.9" }))
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
          return Response.redirect(`${url.origin}/pelicula/${encodeURIComponent(slug)}`, 301);
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
