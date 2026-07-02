export async function onRequest(context) {
  const origin = new URL(context.request.url).origin;
  const body = `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /admin

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=UTF-8' }
  });
}
