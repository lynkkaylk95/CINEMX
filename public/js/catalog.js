(function () {
  const source = Array.isArray(window.MOVIES) ? window.MOVIES : (typeof MOVIES !== 'undefined' ? MOVIES : []);
  const slugify = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const movieSlug = movie => movie.slug || slugify(movie.title) || `pelicula-${movie.id}`;
  const genres = movie => Array.isArray(movie.genres) && movie.genres.length ? movie.genres : [movie.genre].filter(Boolean);
  const ytId = value => {
    const raw = String(value || '');
    const match = raw.match(/(?:vi\/|v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/) || raw.match(/^([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : '';
  };
  const image = movie => {
    const thumb = String(movie.thumb || '');
    if (thumb && !/(youtube\.com|youtu\.be)/.test(thumb)) return thumb;
    const id = ytId(thumb) || ytId(movie.yt);
    return id ? `https://i3.ytimg.com/vi/${id}/hqdefault.jpg` : '';
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const path = decodeURIComponent(location.pathname);
  const genreMatch = path.match(/\/genero\/([^/]+)/);
  const yearMatch = path.match(/\/ano\/(\d{4})/);
  const selectedGenre = genreMatch ? genreMatch[1] : '';
  const selectedYear = yearMatch ? Number(yearMatch[1]) : 0;
  const prettyGenre = selectedGenre
    ? selectedGenre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  let list = source.filter(movie => {
    if (selectedYear) return Number(movie.year) === selectedYear;
    if (!selectedGenre) return true;
    if (selectedGenre === 'series') return String(movie.type).toLowerCase() === 'serie' || genres(movie).some(g => slugify(g) === 'series');
    return genres(movie).some(g => slugify(g) === selectedGenre);
  });

  const title = selectedYear ? `Películas de ${selectedYear}` : (prettyGenre || 'Todas las películas');
  document.getElementById('catalog-title').textContent = title;
  document.getElementById('catalog-copy').textContent = selectedYear
    ? `Estrenos y favoritas publicadas en ${selectedYear}, reunidas en un solo lugar.`
    : `Historias de ${prettyGenre.toLowerCase()} seleccionadas para ver cuando quieras.`;
  document.title = `${title} en español latino — CineMax MX`;
  document.getElementById('meta-desc').content = `Mira ${title.toLowerCase()} en español latino en CineMax MX.`;
  document.querySelectorAll('.filter-strip a,.year-strip a').forEach(a => {
    const active = selectedYear ? a.textContent.trim() === String(selectedYear) : a.getAttribute('href')?.endsWith(`/${selectedGenre}`);
    a.classList.toggle('active', active);
  });

  function card(movie) {
    return `<a class="discovery-card" href="/pelicula/${encodeURIComponent(movieSlug(movie))}">
      <div class="poster">
        ${image(movie) ? `<img src="${escape(image(movie))}" alt="${escape(movie.title)}" loading="lazy">` : '<div class="poster-fallback">CINE<span>MAX</span></div>'}
        <span class="quality">${String(movie.type).toLowerCase() === 'serie' ? 'SERIE' : 'HD'}</span>
        <span class="rating">★ ${escape(movie.rating || '—')}</span>
        <span class="details-cta">Ver detalles</span>
      </div>
      <h2>${escape(movie.title)}</h2>
      <p>${escape(movie.year)} · ${escape(genres(movie).slice(0, 2).join(' · '))}</p>
    </a>`;
  }

  function ad(index) {
    const video = (index / 9) % 2 === 0;
    return `<aside class="feed-ad ${video ? 'feed-ad-video' : 'feed-ad-native'}" aria-label="Publicidad">
      <span class="ad-label">PUBLICIDAD</span>
      <div class="ad-visual">${video ? '<span class="ad-play">▶</span><small>Video patrocinado</small>' : '<span>Contenido recomendado</span><strong>Descubre una oferta elegida para ti</strong>'}</div>
      <div class="ad-copy"><strong>${video ? 'Una pausa breve antes de seguir explorando' : 'Una recomendación para tu próxima noche de cine'}</strong><span>${video ? 'El video comenzará solo cuando sea visible.' : 'Espacio native banner adaptable a tu red publicitaria.'}</span></div>
    </aside>`;
  }

  function render(sort) {
    const sorted = [...list].sort((a, b) => sort === 'newest'
      ? Number(b.year) - Number(a.year)
      : sort === 'rating' ? Number(b.rating) - Number(a.rating) : Number(b.id) - Number(a.id));
    const chunks = [];
    sorted.forEach((movie, index) => {
      chunks.push(card(movie));
      if ((index + 1) % 9 === 0 && index < sorted.length - 1) chunks.push(ad(index + 1));
    });
    document.getElementById('catalog-feed').innerHTML = chunks.join('');
    document.getElementById('result-count').textContent = sorted.length;
    document.getElementById('empty-state').hidden = sorted.length > 0;
  }
  document.getElementById('sort-select').addEventListener('change', event => render(event.target.value));
  render('popular');
})();
