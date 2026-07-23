import { getAssetHtml } from './_seo-utils.js';

export async function onRequest(context) {
  const html = await getAssetHtml(context, '/catalog.html');
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=UTF-8' }
  });
}
