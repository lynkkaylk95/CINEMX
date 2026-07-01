/* ============================================================
   CineMax MX - app.js
   Logic for index.html (Main Page)
============================================================ */

const MOVIES_STORAGE_KEY = 'cinemax_movies';
let currentGenre = 'Todos';
let currentSearch = '';
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

function createCard(m) {
  const hasThumb = m.thumb && String(m.thumb).trim() !== '';
  const bgStyle = hasThumb ? '' : `background: linear-gradient(135deg, ${hashColor(m.id)})`;
  return `
    <div class="card" onclick="navigateToMovie(${Number(m.id)})">
      <div class="card-thumb" style="${bgStyle}">
        ${hasThumb ? `<img class="card-thumb-img" src="${escapeAttr(m.thumb)}" alt="${escapeAttr(m.title)}" loading="lazy">` : `<div class="card-thumb-emoji">${escapeHTML(m.emoji || '🎬')}</div>`}
        ${m.badge ? `<div class="card-badge">${escapeHTML(m.badge)}</div>` : ''}
        <div class="card-rating">⭐ ${escapeHTML(m.rating)}</div>
        <div class="card-overlay"><div class="card-play">▶</div></div>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHTML(m.title)}</div>
        <div class="card-meta"><span>${escapeHTML(m.year)}</span><span class="card-genre-tag">${escapeHTML(m.genre)}</span></div>
      </div>
    </div>`;
}

function createFeatCard(m) {
  const hasThumb = m.thumb && String(m.thumb).trim() !== '';
  const bgStyle = hasThumb ? '' : `background: linear-gradient(135deg, ${hashColor(m.id)})`;
  return `
    <div class="feat-card" onclick="navigateToMovie(${Number(m.id)})">
      <div class="feat-thumb" style="${bgStyle}">
        ${hasThumb ? `<img class="card-thumb-img" src="${escapeAttr(m.thumb)}" alt="${escapeAttr(m.title)}" loading="lazy">` : `<div class="feat-thumb-emoji">${escapeHTML(m.emoji || '🎬')}</div>`}
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
    </div>`;
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
    const matchG = genre === 'Todos' || m.genre === genre;
    const haystack = normalizeText([m.title, m.genre, m.type, m.desc, m.year].join(' '));
    return matchG && (!query || haystack.includes(query));
  });
}

function showSection(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
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

  if (currentGenre === 'Todos' && !currentSearch) {
    const trending = moviesList.filter(m => m.badge && m.type === 'Película').slice(0, 8);
    const newMovies = moviesList.filter(m => Number(m.year) === 2026 && m.type === 'Película').slice(0, 8);
    const series = moviesList.filter(m => m.type === 'Serie').slice(0, 4);
    const action = moviesList.filter(m => m.genre === 'Acción').slice(0, 8);
    const comedy = moviesList.filter(m => m.genre === 'Comedia').slice(0, 8);
    renderGrid('grid-trending', trending.length ? trending : moviesList.slice(0, 8));
    renderGrid('grid-new', newMovies.length ? newMovies : moviesList.slice(0, 8));
    renderGrid('grid-series', series, 'feat');
    renderGrid('grid-action', action);
    renderGrid('grid-comedy', comedy);
    showSection('sect-series', 'block');
    showSection('sect-comedy', 'block');
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
    showSection('sect-series', 'none');
    showSection('sect-comedy', 'none');
    showSection('sect-new', 'none');
    showSection('sect-action', 'none');
    const titleEl = document.querySelector('#sect-trending .section-title');
    if (titleEl) titleEl.innerHTML = currentSearch ? `<span class="icon">🔍</span> Resultados para "${escapeHTML(currentSearch)}" <span class="section-line"></span>` : `<span class="icon">🎬</span> ${escapeHTML(currentGenre)} <span class="section-line"></span>`;
  }
}

function navigateToMovie(id) {
  window.location.href = `movie.html?id=${encodeURIComponent(id)}`;
}

function syncUrl() {
  const url = new URL(window.location.href);
  currentGenre === 'Todos' ? url.searchParams.delete('genre') : url.searchParams.set('genre', currentGenre);
  currentSearch ? url.searchParams.set('q', currentSearch) : url.searchParams.delete('q');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function updateGenreTabs() {
  document.querySelectorAll('.genre-tab').forEach(t => {
    const text = t.textContent.trim();
    t.classList.toggle('active', text.includes(currentGenre) || (currentGenre === 'Todos' && text.includes('Todos')));
  });
}

function handleSearch(val) {
  currentSearch = val.trim();
  currentGenre = 'Todos';
  updateGenreTabs();
  syncUrl();
  renderAll();
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
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = '';
  if (mobSearchInp) mobSearchInp.value = '';
  updateGenreTabs();
  syncUrl();
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('open');
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
  const validGenres = new Set(['Todos', ...moviesList.map(m => m.genre)]);
  if (genre && validGenres.has(genre)) currentGenre = genre;
  if (search) {
    currentSearch = search.trim();
    currentGenre = 'Todos';
  }
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = currentSearch;
  if (mobSearchInp) mobSearchInp.value = currentSearch;
  updateGenreTabs();
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-top');
  if (btn) btn.classList.toggle('show', window.scrollY > 400);
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input')?.addEventListener('input', e => handleSearch(e.target.value));
  applyInitialQueryParams();
  renderAll();
});