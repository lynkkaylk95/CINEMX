export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getMovieSlug(movie) {
  return movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`;
}

export const SITE_ORIGIN = 'https://cinemaxmx.com';

export function cleanDescription(value, maxLength = 155) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

export function getYouTubeId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
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
  const directId = raw.split(/[?&#]/)[0].split('&')[0].trim().match(/^([A-Za-z0-9_-]{6,})$/);
  return directId ? directId[1] : '';
}

export async function getMovies(context) {
  const assetUrl = new URL('/js/movies.js', context.request.url);
  const response = await context.env.ASSETS.fetch(assetUrl);
  const source = await response.text();
  const match = source.match(/const\s+MOVIES\s*=\s*(\[[\s\S]*?\]);?\s*$/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

export async function getAssetHtml(context, pathname) {
  const assetUrl = new URL(pathname, context.request.url);
  const response = await context.env.ASSETS.fetch(assetUrl);
  return response.text();
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export function replaceMetaContent(html, id, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(`(<(?:meta|link)[^>]*id="${id}"[^>]*(?:content|href)=")[^"]*(")`);
  return html.replace(pattern, `$1${escaped}$2`);
}
