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
  const viewCache = {};
  const weeklyViewCache = {};
  let viewRequestId = 0;
  const formatViews = value => {
    const number = Math.max(0, Number(value) || 0);
    if (number >= 1000000) return `${Math.round(number / 100000) / 10}M`;
    if (number >= 1000) return `${Math.round(number / 100) / 10}K`;
    return String(Math.round(number));
  };
  const path = decodeURIComponent(location.pathname);
  const genreMatch = path.match(/\/genero\/([^/]+)/);
  const yearMatch = path.match(/\/ano\/(\d{4})/);
  const selectedGenre = genreMatch ? genreMatch[1] : '';
  const selectedYear = yearMatch ? Number(yearMatch[1]) : 0;
  const searchMode = /^\/buscar\/?$/.test(path);
  const trendingMode = /^\/tendencias\/?$/.test(path);
  let currentSort = trendingMode ? 'weekly' : 'popular';
  let searchQuery = new URLSearchParams(location.search).get('q')?.trim() || '';
  const prettyGenre = selectedGenre
    ? selectedGenre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  const baseList = source.filter(movie => {
    if (selectedYear) return Number(movie.year) === selectedYear;
    if (!selectedGenre) return true;
    if (selectedGenre === 'series') return String(movie.type).toLowerCase() === 'serie' || genres(movie).some(g => slugify(g) === 'series');
    return genres(movie).some(g => slugify(g) === selectedGenre);
  });
  let list = baseList;

  const title = trendingMode ? 'Más Vistos Esta Semana' : searchMode ? 'Buscar en CineMax' : selectedYear ? `Películas de ${selectedYear}` : (prettyGenre || 'Todas las películas');
  document.getElementById('catalog-title').textContent = title;
  document.getElementById('catalog-copy').textContent = trendingMode
    ? 'Las películas más vistas por la comunidad durante esta semana.'
    : searchMode
    ? 'Encuentra rápidamente tu próxima película o serie.'
    : selectedYear
    ? `Estrenos y favoritas publicadas en ${selectedYear}, reunidas en un solo lugar.`
    : `Historias de ${prettyGenre.toLowerCase()} seleccionadas para ver cuando quieras.`;
  document.title = `${title} — CineMax MX`;
  document.getElementById('meta-desc').content = `Mira ${title.toLowerCase()} en español latino en CineMax MX.`;
  document.querySelectorAll('.filter-strip a,.year-strip a').forEach(a => {
    const active = selectedYear ? a.textContent.trim() === String(selectedYear) : a.getAttribute('href')?.endsWith(`/${selectedGenre}`);
    a.classList.toggle('active', active);
  });

  function card(movie) {
    const slug = movieSlug(movie);
    return `<a class="discovery-card" href="/pelicula/${encodeURIComponent(slug)}" data-view-slug="${escape(slug)}">
      <div class="poster">
        ${image(movie) ? `<img src="${escape(image(movie))}" alt="${escape(movie.title)}" loading="lazy">` : '<div class="poster-fallback">CINE<span>MAX</span></div>'}
        <span class="quality">${String(movie.type).toLowerCase() === 'serie' ? 'SERIE' : 'HD'}</span>
        <span class="rating">★ ${escape(movie.rating || '—')}</span>
        <span class="catalog-view-count" aria-label="Visualizaciones"><span aria-hidden="true">◉</span><span data-catalog-view-count>${slug in viewCache ? formatViews(viewCache[slug]) : '—'}</span></span>
        <span class="details-cta">Ver detalles</span>
      </div>
      <h2>${escape(movie.title)}</h2>
      <p>${escape(movie.year)} · ${escape(genres(movie).slice(0, 2).join(' · '))}</p>
    </a>`;
  }

  function ad(sequence) {
    return `<aside id="catalog-native-slot-${sequence}" class="feed-ad feed-ad-native ad-zone-home-feed catalog-native-slot" aria-label="Publicidad">
      <span class="ad-label">PUBLICIDAD</span>
      <div class="ad-visual"><span>Contenido recomendado</span><strong>Descubre una oferta elegida para ti</strong></div>
      <div class="ad-copy"><strong>Una recomendación para tu próxima noche de cine</strong><span>Espacio native banner adaptable a tu red publicitaria.</span></div>
    </aside>`;
  }

  function getAdInterval() {
    if (matchMedia('(max-width: 640px)').matches) return 6;
    if (matchMedia('(max-width: 1000px)').matches) return 12;
    return 18;
  }

  function applySearch() {
    const query = slugify(searchQuery);
    list = !query ? baseList : baseList.filter(movie => slugify([
      movie.title, movie.desc, movie.type, movie.year, ...genres(movie)
    ].join(' ')).includes(query));
  }

  async function loadCatalogViews() {
    const requestId = ++viewRequestId;
    const cards = [...document.querySelectorAll('.discovery-card[data-view-slug]')];
    const slugs = [...new Set(cards.map(card => card.dataset.viewSlug).filter(Boolean))];
    const missing = slugs.filter(slug => !(slug in viewCache));
    try {
      for (let index = 0; index < missing.length; index += 80) {
        const batch = missing.slice(index, index + 80);
        const response = await fetch(`/api/views?slugs=${encodeURIComponent(batch.join(','))}`);
        if (!response.ok) throw new Error(`Views API: ${response.status}`);
        const data = await response.json();
        Object.assign(viewCache, data.views || {});
        Object.assign(weeklyViewCache, data.weeklyViews || {});
      }
    } catch (error) {
      console.warn('No se pudieron cargar las visualizaciones del catálogo.', error);
      missing.forEach(slug => { viewCache[slug] = 0; });
    }
    if (requestId !== viewRequestId) return;
    if (currentSort === 'weekly' && missing.length) {
      render('weekly');
      return;
    }
    document.querySelectorAll('.discovery-card[data-view-slug]').forEach(card => {
      const count = card.querySelector('[data-catalog-view-count]');
      if (count) count.textContent = formatViews(viewCache[card.dataset.viewSlug] || 0);
    });
  }

  function render(sort) {
    currentSort = sort;
    applySearch();
    const feed = document.getElementById('catalog-feed');
    const sorted = [...list].sort((a, b) => sort === 'weekly'
      ? (weeklyViewCache[movieSlug(b)] || 0) - (weeklyViewCache[movieSlug(a)] || 0)
      : sort === 'newest'
      ? Number(b.year) - Number(a.year)
      : sort === 'rating' ? Number(b.rating) - Number(a.rating) : Number(b.id) - Number(a.id));
    const chunks = [];
    const adInterval = getAdInterval();
    sorted.forEach((movie, index) => {
      chunks.push(card(movie));
      if ((index + 1) % adInterval === 0) {
        chunks.push(ad((index + 1) / adInterval));
      } else if (index === sorted.length - 1 && sorted.length < adInterval) {
        chunks.push(ad(1));
      }
    });
    feed.innerHTML = chunks.join('');
    window.dispatchEvent(new CustomEvent('cinemax:ads-refresh'));
    document.getElementById('result-count').textContent = sorted.length;
    document.getElementById('empty-state').hidden = sorted.length > 0;
    loadCatalogViews();
  }
  if (searchMode) {
    const form = document.getElementById('catalog-search');
    const input = document.getElementById('catalog-search-input');
    form.hidden = false;
    input.value = searchQuery;
    input.addEventListener('input', () => {
      searchQuery = input.value.trim();
      history.replaceState({}, '', searchQuery ? `/buscar?q=${encodeURIComponent(searchQuery)}` : '/buscar');
      render(document.getElementById('sort-select').value);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      searchQuery = input.value.trim();
      render(document.getElementById('sort-select').value);
    });
    document.querySelector('.mobile-dock a:last-child')?.classList.add('active');
    setTimeout(() => input.focus(), 80);
  }
  document.getElementById('sort-select').addEventListener('change', event => render(event.target.value));
  let lastInterval = getAdInterval();
  addEventListener('resize', () => {
    const interval = getAdInterval();
    if (interval !== lastInterval) {
      lastInterval = interval;
      render(document.getElementById('sort-select').value);
    }
  });
  document.getElementById('sort-select').value = currentSort;
  render(currentSort);
})();
