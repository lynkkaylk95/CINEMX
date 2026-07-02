import { escapeHtml, getAssetHtml, replaceMetaContent } from '../_seo-utils.js';

export async function onRequest(context) {
  const year = String(context.params.year || '').match(/^\d{4}$/)?.[0] || '';
  let html = await getAssetHtml(context, '/index.html');
  if (!year) {
    return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
  }

  const origin = new URL(context.request.url).origin;
  const canonicalUrl = `${origin}/ano/${year}`;
  const title = `Películas ${year} en español latino — CineMax MX`;
  const description = `Mira películas y series de ${year} en español latino en CineMax MX. Estrenos, dramas, romance, acción y títulos populares.`;

  html = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" id="meta-desc" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" id="canonical-link" href="${escapeHtml(canonicalUrl)}">`);
  html = replaceMetaContent(html, 'og-title', title);
  html = replaceMetaContent(html, 'og-desc', description);
  html = replaceMetaContent(html, 'og-url', canonicalUrl);
  html = replaceMetaContent(html, 'twitter-title', title);
  html = replaceMetaContent(html, 'twitter-desc', description);

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=UTF-8' },
    status: 200
  });
}
