import { SITE_ORIGIN } from './_seo-utils.js';

export async function onRequest(context) {
  const body = `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /admin

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=UTF-8' }
  });
}
