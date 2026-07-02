import { cleanDescription, escapeHtml, getAssetHtml, getMovieSlug, getMovies, getYouTubeId, replaceMetaContent } from '../_seo-utils.js';

export async function onRequest(context) {
  const slug = decodeURIComponent(context.params.slug || '');
  const movies = await getMovies(context);
  const movie = movies.find(item => getMovieSlug(item) === slug);
  let html = await getAssetHtml(context, '/movie.html');

  if (!movie) {
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=UTF-8' },
      status: 200
    });
  }

  const origin = new URL(context.request.url).origin;
  const canonicalUrl = `${origin}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`;
  const ytId = getYouTubeId(movie.yt);
  const poster = movie.thumb || (ytId ? `https://i3.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg` : 'https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg');
  const title = `${movie.title} — CineMax MX`;
  const description = cleanDescription(movie.desc || `Mira ${movie.title} en español latino en CineMax MX.`);

  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title id="page-title">${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" id="meta-desc" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" id="canonical-link" href="${escapeHtml(canonicalUrl)}">`);
  html = replaceMetaContent(html, 'og-title', title);
  html = replaceMetaContent(html, 'og-desc', description);
  html = replaceMetaContent(html, 'og-url', canonicalUrl);
  html = replaceMetaContent(html, 'og-image', poster);
  html = replaceMetaContent(html, 'twitter-title', title);
  html = replaceMetaContent(html, 'twitter-desc', description);
  html = replaceMetaContent(html, 'twitter-image', poster);

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=UTF-8' },
    status: 200
  });
}
