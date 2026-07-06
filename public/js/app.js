/* ============================================================
   CineMax MX - app.js
   Logic for index.html (Main Page)
============================================================ */

const MOVIES_STORAGE_KEY = 'cinemax_movies';
const STATIC_GENRES = [
  'Acción',
  'Comedia',
  'Drama',
  'Familia',
  'Emotivo',
  'Ciencia Ficción',
  'Romance',
  'Thriller',
  'Series',
  'Escolar',
  'Viajes en el tiempo',
  'De época',
  'Intrigas palaciegas'
];
const GENRE_ALIASES = {
  'Học đường': 'Escolar',
  'Xuyên không': 'Viajes en el tiempo',
  'Cổ trang': 'De época',
  'Cung đấu': 'Intrigas palaciegas'
};
let currentGenre = 'Todos';
let currentSearch = '';
let currentYear = '';
let moviesList = loadMoviesList();

function loadMoviesList() {
  try {
    const saved = localStorage.getItem(MOVIES_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('No se pudo leer la lista local de peliculas.', err);
  }
  return typeof MOVIES !== 'undefined' ? [...MOVIES] : [];
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHTML(value).replace(/`/g, '&#96;');
}

function getMovieGenres(movie) {
  const values = Array.isArray(movie?.genres) ? movie.genres : [];
  const legacy = movie?.genre ? [movie.genre] : [];
  return [...new Set([...values, ...legacy].map(g => {
    const genre = String(g || '').trim();
    return GENRE_ALIASES[genre] || genre;
  }).filter(Boolean))];
}

function getGenreLabel(movie) {
  return getMovieGenres(movie).join(' • ') || '-';
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMovieSlug(movie) {
  return movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`;
}

function getMovieUrl(movie) {
  return `/pelicula/${encodeURIComponent(getMovieSlug(movie))}`;
}

function hasGenre(movie, genre) {
  return genre === 'Todos' || getMovieGenres(movie).includes(genre);
}

function getYouTubeId(value) {
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

function getThumbnailUrl(value, fallbackYtId = '') {
  const raw = String(value || '').trim();
  const ytId = getYouTubeId(raw) || fallbackYtId;
  if (ytId && /(?:youtube\.com|youtu\.be|ytimg\.com|^[A-Za-z0-9_-]{6,})/.test(raw)) {
    return `https://i3.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg`;
  }
  return raw || (ytId ? `https://i3.ytimg.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg` : '');
}

function getMovieImage(movie) {
  return getThumbnailUrl(movie?.thumb, getYouTubeId(movie?.yt));
}

function dailyHeroIndex(total) {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % total;
}

function initDailyHero() {
  const hero = document.getElementById('hero');
  const titleEl = document.getElementById('hero-title');
  const descEl = document.getElementById('hero-desc');
  const bgEl = document.querySelector('.hero-bg');
  const badgeEl = document.querySelector('.hero-badge');
  const metaEl = document.querySelector('.hero-meta');
  const playBtn = document.querySelector('.hero-btns .btn-play');
  const infoBtn = document.querySelector('.hero-btns .btn-info');
  const candidates = moviesList.filter(m => m && m.id && m.title);
  if (!hero || !titleEl || !descEl || !candidates.length) return;

  const movie = candidates[dailyHeroIndex(candidates.length)];
  const imageUrl = getMovieImage(movie);
  const movieId = Number(movie.id);

  titleEl.textContent = movie.title || 'CineMax MX';
  descEl.textContent = movie.desc || 'Disfruta una selección destacada de películas y series en español de México.';

  if (badgeEl) {
    badgeEl.textContent = movie.type === 'Serie' ? 'Serie destacada del día' : 'Película destacada del día';
  }

  if (metaEl) {
    metaEl.innerHTML = `
      <span class="hero-meta-item">
        <span class="rating-pill">★ ${escapeHTML(movie.rating || '0.0')}</span>
      </span>
      <span class="hero-meta-item"><span class="dot"></span> ${escapeHTML(movie.year || '-')}</span>
      <span class="hero-meta-item"><span class="dot"></span> ${escapeHTML(movie.duration || '-')}</span>
      <span class="hero-meta-item"><span class="dot"></span> ${escapeHTML(getGenreLabel(movie))}</span>
    `;
  }

  if (imageUrl && bgEl) {
    bgEl.style.backgroundImage = `url("${imageUrl.replace(/"/g, '\\"')}")`;
    hero.classList.add('has-featured-image');
  }

  if (playBtn) playBtn.onclick = () => navigateToMovie(movieId);
  if (infoBtn) infoBtn.onclick = () => navigateToMovie(movieId);
}

function createCard(m) {
  const thumbUrl = getMovieImage(m);
  const hasThumb = thumbUrl !== '';
  const bgStyle = hasThumb ? '' : `background: linear-gradient(135deg, ${hashColor(m.id)})`;
  return `
    <a class="card" href="${escapeAttr(getMovieUrl(m))}">
      <div class="card-thumb" style="${bgStyle}">
        ${hasThumb ? `<img class="card-thumb-img" src="${escapeAttr(thumbUrl)}" alt="Poster de ${escapeAttr(m.title)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://i3.ytimg.com/vi/${escapeAttr(getYouTubeId(m.yt))}/hqdefault.jpg';">` : `<div class="card-thumb-emoji">${escapeHTML(m.emoji || '🎬')}</div>`}
        ${m.badge ? `<div class="card-badge">${escapeHTML(m.badge)}</div>` : ''}
        <div class="card-rating">⭐ ${escapeHTML(m.rating)}</div>
        <div class="card-overlay"><div class="card-play">▶</div></div>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHTML(m.title)}</div>
        <div class="card-meta"><span>${escapeHTML(m.year)}</span><span class="card-genre-tag">${escapeHTML(getGenreLabel(m))}</span></div>
      </div>
    </a>`;
}

function createFeatCard(m) {
  const thumbUrl = getMovieImage(m);
  const hasThumb = thumbUrl !== '';
  const bgStyle = hasThumb ? '' : `background: linear-gradient(135deg, ${hashColor(m.id)})`;
  return `
    <a class="feat-card" href="${escapeAttr(getMovieUrl(m))}">
      <div class="feat-thumb" style="${bgStyle}">
        ${hasThumb ? `<img class="card-thumb-img" src="${escapeAttr(thumbUrl)}" alt="Poster de ${escapeAttr(m.title)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://i3.ytimg.com/vi/${escapeAttr(getYouTubeId(m.yt))}/hqdefault.jpg';">` : `<div class="feat-thumb-emoji">${escapeHTML(m.emoji || '🎬')}</div>`}
        <div class="feat-play-wrap"><div class="feat-play-btn">▶</div></div>
        ${m.badge ? `<div class="card-badge">${escapeHTML(m.badge)}</div>` : ''}
        <div class="card-rating">⭐ ${escapeHTML(m.rating)}</div>
      </div>
      <div class="feat-info">
        <div class="feat-title">${escapeHTML(m.title)}</div>
        <div class="feat-desc">${escapeHTML(m.desc)}</div>
        <div class="feat-footer">
          <div class="feat-tags"><span class="feat-tag">${escapeHTML(m.type)}</span><span class="feat-tag">${escapeHTML(m.year)}</span><span class="feat-tag">${escapeHTML(m.duration)}</span></div>
          <div class="feat-rating">⭐ ${escapeHTML(m.rating)}</div>
        </div>
      </div>
    </a>`;
}

function hashColor(id) {
  const colors = ['#1a0a2e, #16213e', '#0d1a0d, #1a3a1a', '#1a0a0a, #3a1a0a', '#0a0a1a, #1a0a3a', '#1a1a0a, #3a2a0a', '#0a1a1a, #0a2a2a', '#1a0a1a, #2a0a2a', '#0d0d0d, #2a1a0a', '#0a1a0a, #1a3a2a'];
  return colors[Math.abs(Number(id) || 0) % colors.length];
}

function renderGrid(gridId, movies, cardType = 'card') {
  const el = document.getElementById(gridId);
  if (!el) return;
  el.innerHTML = movies && movies.length ? movies.map(m => cardType === 'feat' ? createFeatCard(m) : createCard(m)).join('') : '';
}

function filterMovies(genre, search) {
  const query = normalizeText(search);
  return moviesList.filter(m => {
    const matchG = hasGenre(m, genre);
    const matchYear = !currentYear || Number(m.year) === Number(currentYear);
    const haystack = normalizeText([m.title, getGenreLabel(m), m.type, m.desc, m.year].join(' '));
    return matchG && matchYear && (!query || haystack.includes(query));
  });
}

function showSection(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}

function scrollToMovieResults(behavior = 'smooth') {
  const target = document.getElementById('sect-trending') || document.getElementById('main');
  if (!target) return;
  const navHeight = document.getElementById('navbar')?.offsetHeight || 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 18;
  window.scrollTo({ top: Math.max(0, targetTop), behavior });
}

function renderAll() {
  const filtered = filterMovies(currentGenre, currentSearch);
  const noRes = document.getElementById('no-results');
  if (!filtered.length) {
    if (noRes) noRes.style.display = 'block';
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    return;
  }
  if (noRes) noRes.style.display = 'none';
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'block');

  if (currentGenre === 'Todos' && !currentSearch && !currentYear) {
    const trending = moviesList.filter(m => m.badge && m.type === 'Película').slice(0, 8);
    const newMovies = moviesList.filter(m => Number(m.year) === 2026 && m.type === 'Película').slice(0, 8);
    const series = moviesList.filter(m => m.type === 'Serie').slice(0, 4);
    const action = moviesList.filter(m => hasGenre(m, 'Acción')).slice(0, 8);
    const comedy = moviesList.filter(m => hasGenre(m, 'Comedia')).slice(0, 8);
    const drama = moviesList.filter(m => hasGenre(m, 'Drama')).slice(0, 8);
    const family = moviesList.filter(m => hasGenre(m, 'Familia')).slice(0, 8);
    const emotive = moviesList.filter(m => hasGenre(m, 'Emotivo')).slice(0, 8);
    const sciFi = moviesList.filter(m => hasGenre(m, 'Ciencia Ficción')).slice(0, 8);
    const romance = moviesList.filter(m => hasGenre(m, 'Romance')).slice(0, 8);
    const thriller = moviesList.filter(m => hasGenre(m, 'Thriller')).slice(0, 8);
    const school = moviesList.filter(m => hasGenre(m, 'Escolar')).slice(0, 8);
    const timeTravel = moviesList.filter(m => hasGenre(m, 'Viajes en el tiempo')).slice(0, 8);
    const costume = moviesList.filter(m => hasGenre(m, 'De época')).slice(0, 8);
    const palace = moviesList.filter(m => hasGenre(m, 'Intrigas palaciegas')).slice(0, 8);
    renderGrid('grid-trending', trending.length ? trending : moviesList.slice(0, 8));
    renderGrid('grid-new', newMovies.length ? newMovies : moviesList.slice(0, 8));
    renderGrid('grid-series', series, 'feat');
    renderGrid('grid-action', action);
    renderGrid('grid-comedy', comedy);
    renderGrid('grid-drama', drama);
    renderGrid('grid-family', family);
    renderGrid('grid-emotive', emotive);
    renderGrid('grid-sci-fi', sciFi);
    renderGrid('grid-romance', romance);
    renderGrid('grid-thriller', thriller);
    renderGrid('grid-school', school);
    renderGrid('grid-time-travel', timeTravel);
    renderGrid('grid-costume', costume);
    renderGrid('grid-palace', palace);
    showSection('sect-series', 'block');
    showSection('sect-comedy', 'block');
    showSection('sect-drama', 'block');
    showSection('sect-family', family.length ? 'block' : 'none');
    showSection('sect-emotive', emotive.length ? 'block' : 'none');
    showSection('sect-sci-fi', 'block');
    showSection('sect-romance', 'block');
    showSection('sect-thriller', 'block');
    showSection('sect-school', school.length ? 'block' : 'none');
    showSection('sect-time-travel', timeTravel.length ? 'block' : 'none');
    showSection('sect-costume', costume.length ? 'block' : 'none');
    showSection('sect-palace', palace.length ? 'block' : 'none');
    showSection('sect-new', 'block');
    showSection('sect-action', 'block');
    const titleEl = document.querySelector('#sect-trending .section-title');
    if (titleEl) titleEl.innerHTML = '<span class="icon">🔥</span> Más Vistos Esta Semana <span class="section-line"></span>';
  } else {
    renderGrid('grid-trending', filtered);
    renderGrid('grid-new', []);
    renderGrid('grid-series', []);
    renderGrid('grid-action', []);
    renderGrid('grid-comedy', []);
    renderGrid('grid-drama', []);
    renderGrid('grid-family', []);
    renderGrid('grid-emotive', []);
    renderGrid('grid-sci-fi', []);
    renderGrid('grid-romance', []);
    renderGrid('grid-thriller', []);
    renderGrid('grid-school', []);
    renderGrid('grid-time-travel', []);
    renderGrid('grid-costume', []);
    renderGrid('grid-palace', []);
    showSection('sect-series', 'none');
    showSection('sect-comedy', 'none');
    showSection('sect-drama', 'none');
    showSection('sect-family', 'none');
    showSection('sect-emotive', 'none');
    showSection('sect-sci-fi', 'none');
    showSection('sect-romance', 'none');
    showSection('sect-thriller', 'none');
    showSection('sect-school', 'none');
    showSection('sect-time-travel', 'none');
    showSection('sect-costume', 'none');
    showSection('sect-palace', 'none');
    showSection('sect-new', 'none');
    showSection('sect-action', 'none');
    const titleEl = document.querySelector('#sect-trending .section-title');
    if (titleEl) {
      titleEl.innerHTML = currentSearch
        ? `<span class="icon">🔍</span> Resultados para "${escapeHTML(currentSearch)}" <span class="section-line"></span>`
        : currentYear
          ? `<span class="icon">📅</span> Películas de ${escapeHTML(currentYear)} <span class="section-line"></span>`
          : `<span class="icon">🎬</span> ${escapeHTML(currentGenre)} <span class="section-line"></span>`;
    }
  }
}

function navigateToMovie(id) {
  const movie = moviesList.find(m => Number(m.id) === Number(id));
  window.location.href = movie ? getMovieUrl(movie) : `/pelicula/pelicula-${encodeURIComponent(id)}`;
}

function syncUrl() {
  const url = new URL(window.location.href);
  if (currentYear) {
    url.pathname = `/ano/${encodeURIComponent(currentYear)}`;
    url.search = '';
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    return;
  }
  if (/\/ano\/\d{4}\/?$/.test(url.pathname)) {
    url.pathname = '/';
  }
  currentGenre === 'Todos' ? url.searchParams.delete('genre') : url.searchParams.set('genre', currentGenre);
  currentSearch ? url.searchParams.set('q', currentSearch) : url.searchParams.delete('q');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function updateGenreTabs() {
  document.querySelectorAll('.genre-tab').forEach(t => {
    const text = t.textContent.trim();
    t.classList.toggle('active', text.includes(currentGenre) || (currentGenre === 'Todos' && text.includes('Todos')));
  });
  document.querySelectorAll('.year-tab').forEach(t => {
    t.classList.toggle('active', Boolean(currentYear) && t.textContent.trim() === String(currentYear));
  });
}

function handleSearch(val) {
  currentSearch = val.trim();
  currentGenre = 'Todos';
  currentYear = '';
  updateGenreTabs();
  syncUrl();
  renderAll();
  updatePageSeo();
}

function toggleSearch() {
  const box = document.getElementById('search-box');
  if (!box) return;
  box.classList.toggle('open');
  if (box.classList.contains('open')) setTimeout(() => document.getElementById('search-input')?.focus(), 250);
}

function filterByGenre(genre) {
  currentGenre = genre;
  currentSearch = '';
  currentYear = '';
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = '';
  if (mobSearchInp) mobSearchInp.value = '';
  updateGenreTabs();
  syncUrl();
  renderAll();
  updatePageSeo();
  scrollToMovieResults();
}

function filterByYear(year) {
  currentYear = Number(year);
  currentGenre = 'Todos';
  currentSearch = '';
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = '';
  if (mobSearchInp) mobSearchInp.value = '';
  updateGenreTabs();
  syncUrl();
  renderAll();
  updatePageSeo();
  scrollToMovieResults();
}

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger');
  menu?.classList.toggle('open');
  hamburger?.classList.toggle('open');
  if (menu?.classList.contains('open')) {
    setTimeout(() => document.getElementById('mob-search-input')?.focus(), 120);
  }
}

function closeMenu() {
  document.getElementById('mobile-menu')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function applyInitialQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const genre = params.get('genre');
  const search = params.get('q');
  const yearMatch = window.location.pathname.match(/\/ano\/(\d{4})\/?$/);
  const validGenres = new Set(['Todos', ...STATIC_GENRES, ...moviesList.flatMap(m => getMovieGenres(m))]);
  if (genre && validGenres.has(genre)) currentGenre = genre;
  if (yearMatch) {
    currentYear = Number(yearMatch[1]);
    currentGenre = 'Todos';
  }
  if (search) {
    currentSearch = search.trim();
    currentGenre = 'Todos';
    currentYear = '';
  }
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = currentSearch;
  if (mobSearchInp) mobSearchInp.value = currentSearch;
  updateGenreTabs();
}

function updatePageSeo() {
  const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : '';
  const canonical = document.getElementById('canonical-link');
  const desc = document.getElementById('meta-desc');
  const ogTitle = document.getElementById('og-title');
  const ogDesc = document.getElementById('og-desc');
  const ogUrl = document.getElementById('og-url');
  const twitterTitle = document.getElementById('twitter-title');
  const twitterDesc = document.getElementById('twitter-desc');
  const title = currentYear
    ? `Películas ${currentYear} en español latino — CineMax MX`
    : 'CineMax MX — Películas y Series en Línea';
  const description = currentYear
    ? `Mira películas y series de ${currentYear} en español latino en CineMax MX. Estrenos, dramas, romance, acción y títulos populares.`
    : 'Películas completas y series en español latino, con estrenos, romance, acción, drama y títulos populares para ver en línea.';
  document.title = title;
  if (desc) desc.content = description;
  if (canonical) canonical.href = origin ? `${origin}${currentYear ? `/ano/${currentYear}` : '/'}` : (currentYear ? `/ano/${currentYear}` : '/');
  if (ogTitle) ogTitle.content = title;
  if (ogDesc) ogDesc.content = description;
  if (ogUrl) ogUrl.content = canonical?.href || window.location.href;
  if (twitterTitle) twitterTitle.content = title;
  if (twitterDesc) twitterDesc.content = description;
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-top');
  if (btn) btn.classList.toggle('show', window.scrollY > 400);
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input')?.addEventListener('input', e => handleSearch(e.target.value));
  document.getElementById('mob-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') closeMenu();
  });
  applyInitialQueryParams();
  initDailyHero();
  renderAll();
  updatePageSeo();
  if (currentGenre !== 'Todos' || currentSearch || currentYear) {
    requestAnimationFrame(() => scrollToMovieResults('auto'));
  }
});
