import { getMovieSlug, getMovies } from './_seo-utils.js';

function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&'"]/g, char => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[char]));
}

export async function onRequest(context) {
  const origin = new URL(context.request.url).origin;
  const movies = await getMovies(context);
  const years = [...new Set(movies.map(movie => Number(movie.year)).filter(Boolean))].sort((a, b) => b - a);
  const urls = [
    { loc: `${origin}/`, priority: '1.0' },
    ...years.map(year => ({ loc: `${origin}/ano/${year}`, priority: '0.8' })),
    ...movies.map(movie => ({ loc: `${origin}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`, priority: '0.9' }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${xmlEscape(url.loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=UTF-8' }
  });
}
