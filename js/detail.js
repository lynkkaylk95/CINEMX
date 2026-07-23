(function () {
  const source = Array.isArray(window.MOVIES) ? window.MOVIES : (typeof MOVIES !== 'undefined' ? MOVIES : []);
  const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const movieSlug = movie => movie.slug || slugify(movie.title) || `pelicula-${movie.id}`;
  const currentSlug = decodeURIComponent(location.pathname.match(/\/pelicula\/([^/]+)/)?.[1] || new URLSearchParams(location.search).get('slug') || '');
  const movie = source.find(item => movieSlug(item) === currentSlug);
  const ytId = value => (String(value || '').match(/(?:vi\/|v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/) || String(value || '').match(/^([A-Za-z0-9_-]{6,})/))?.[1] || '';
  const image = item => {
    const thumb = String(item.thumb || '');
    if (thumb && !/(youtube\.com|youtu\.be)/.test(thumb)) return thumb;
    const id = ytId(thumb) || ytId(item.yt);
    return id ? `https://i3.ytimg.com/vi/${id}/maxresdefault.jpg` : '';
  };
  const genres = item => Array.isArray(item.genres) && item.genres.length ? item.genres : [item.genre].filter(Boolean);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (!movie) {
    document.getElementById('detail-title').textContent = 'Película no encontrada';
    document.getElementById('detail-description').textContent = 'Este título ya no está disponible o la dirección es incorrecta.';
    document.getElementById('watch-button').hidden = true;
    return;
  }
  const heroImage = image(movie);
  const primaryGenre = genres(movie)[0] || 'Películas';
  const genrePath = `/genero/${slugify(primaryGenre)}`;
  document.getElementById('detail-backdrop').style.backgroundImage = `url("${heroImage.replace(/"/g, '\\"')}")`;
  document.getElementById('detail-poster').innerHTML = `<img src="${escape(heroImage)}" alt="${escape(movie.title)}">`;
  document.getElementById('detail-type').textContent = String(movie.type || 'PELÍCULA').toUpperCase();
  document.getElementById('detail-title').textContent = movie.title;
  document.getElementById('crumb-title').textContent = movie.title;
  document.getElementById('detail-description').textContent = movie.desc || 'Descubre esta historia en CineMax MX.';
  document.getElementById('detail-meta').innerHTML = `<span class="score">★ ${escape(movie.rating || '—')}</span><span>${escape(movie.year)}</span><span>${escape(movie.duration || '')}</span><span>${escape(genres(movie).join(' · '))}</span>`;
  document.getElementById('watch-button').href = `/ver/${encodeURIComponent(movieSlug(movie))}`;
  document.getElementById('watch-button').textContent = String(movie.type).toLowerCase() === 'serie' ? '▶ Ver serie' : '▶ Ver película';
  document.getElementById('detail-genre-link').href = genrePath;
  document.getElementById('detail-genre-link').textContent = primaryGenre;
  document.getElementById('more-link').href = genrePath;
  document.title = `${movie.title} — CineMax MX`;
  const related = source.filter(item => item.id !== movie.id && genres(item).some(g => genres(movie).includes(g))).slice(0, 6);
  document.getElementById('related-grid').innerHTML = related.map(item => `<a href="/pelicula/${encodeURIComponent(movieSlug(item))}">
    <img src="${escape(image(item))}" alt="${escape(item.title)}" loading="lazy"><strong>${escape(item.title)}</strong><span>${escape(item.year)} · ★ ${escape(item.rating)}</span></a>`).join('');
  const saveButton = document.getElementById('save-button');
  const key = `cinemax_saved_${movieSlug(movie)}`;
  const syncSaved = () => { const saved = localStorage.getItem(key) === '1'; saveButton.textContent = saved ? '✓ En mi lista' : '＋ Mi lista'; saveButton.classList.toggle('saved', saved); };
  saveButton.addEventListener('click', () => { localStorage.setItem(key, localStorage.getItem(key) === '1' ? '0' : '1'); syncSaved(); });
  syncSaved();
})();
