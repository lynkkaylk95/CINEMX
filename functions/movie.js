import { getMovieSlug, getMovies } from './_seo-utils.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const legacyId = url.searchParams.get('id');
  if (legacyId) {
    const movies = await getMovies(context);
    const movie = movies.find(item => Number(item.id) === Number(legacyId));
    if (movie) {
      return Response.redirect(`${url.origin}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`, 301);
    }
  }
  return context.env.ASSETS.fetch(new URL('/movie.html', context.request.url));
}
