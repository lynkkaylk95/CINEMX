import { SITE_ORIGIN, escapeHtml, getAssetHtml, replaceMetaContent } from '../_seo-utils.js';

export async function onRequest(context) {
  const slug = decodeURIComponent(context.params.genre || '');
  let html = await getAssetHtml(context, '/catalog.html');
  const label = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const canonicalUrl = `${SITE_ORIGIN}/genero/${encodeURIComponent(slug)}`;
  const title = `${label} en español latino — CineMax MX`;
  const description = `Explora películas y series de ${label.toLowerCase()} en español latino en CineMax MX.`;
  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" id="meta-desc" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" id="canonical-link" href="${escapeHtml(canonicalUrl)}">`);
  html = replaceMetaContent(html, 'og-title', title);
  html = replaceMetaContent(html, 'og-desc', description);
  html = replaceMetaContent(html, 'og-url', canonicalUrl);
  return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8' }, status: 200 });
}
