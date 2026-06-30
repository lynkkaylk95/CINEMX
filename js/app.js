/* ============================================================
   CineMax MX — app.js
   Logic for index.html (Main Page)
============================================================ */

let currentGenre = 'Todos';
let currentSearch = '';

// Check if MOVIES is loaded from movies.js
const moviesList = typeof MOVIES !== 'undefined' ? MOVIES : [];

function createCard(m) {
  // Safe check if m.thumb exists, else fallback to custom color emoji
  const hasThumb = m.thumb && m.thumb.trim() !== "";
  const bgStyle = hasThumb ? "" : `background: linear-gradient(135deg, ${hashColor(m.id)})`;
  
  return `
    <div class="card" onclick="navigateToMovie(${m.id})">
      <div class="card-thumb" style="${bgStyle}">
        ${hasThumb 
          ? `<img class="card-thumb-img" src="${m.thumb}" alt="${m.title}" loading="lazy">` 
          : `<div class="card-thumb-emoji">${m.emoji || "🎬"}</div>`
        }
        ${m.badge ? `<div class="card-badge">${m.badge}</div>` : ''}
        <div class="card-rating">⭐ ${m.rating}</div>
        <div class="card-overlay">
          <div class="card-play">▶</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${m.title}</div>
        <div class="card-meta">
          <span>${m.year}</span>
          <span class="card-genre-tag">${m.genre}</span>
        </div>
      </div>
    </div>`;
}

function createFeatCard(m) {
  const hasThumb = m.thumb && m.thumb.trim() !== "";
  const bgStyle = hasThumb ? "" : `background: linear-gradient(135deg, ${hashColor(m.id)})`;

  return `
    <div class="feat-card" onclick="navigateToMovie(${m.id})">
      <div class="feat-thumb" style="${bgStyle}">
        ${hasThumb 
          ? `<img class="card-thumb-img" src="${m.thumb}" alt="${m.title}" loading="lazy">` 
          : `<div class="feat-thumb-emoji">${m.emoji || "🎬"}</div>`
        }
        <div class="feat-play-wrap"><div class="feat-play-btn">▶</div></div>
        ${m.badge ? `<div class="card-badge">${m.badge}</div>` : ''}
        <div class="card-rating">⭐ ${m.rating}</div>
      </div>
      <div class="feat-info">
        <div class="feat-title">${m.title}</div>
        <div class="feat-desc">${m.desc}</div>
        <div class="feat-footer">
          <div class="feat-tags">
            <span class="feat-tag">${m.type}</span>
            <span class="feat-tag">${m.year}</span>
            <span class="feat-tag">${m.duration}</span>
          </div>
          <div class="feat-rating">⭐ ${m.rating}</div>
        </div>
      </div>
    </div>`;
}

function hashColor(id) {
  const colors = [
    '#1a0a2e, #16213e', '#0d1a0d, #1a3a1a', '#1a0a0a, #3a1a0a',
    '#0a0a1a, #1a0a3a', '#1a1a0a, #3a2a0a', '#0a1a1a, #0a2a2a',
    '#1a0a1a, #2a0a2a', '#0d0d0d, #2a1a0a', '#0a1a0a, #1a3a2a'
  ];
  return colors[id % colors.length];
}

function renderGrid(gridId, movies, cardType = 'card') {
  const el = document.getElementById(gridId);
  if (!el) return;
  if (!movies || !movies.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = movies.map(m => cardType === 'feat' ? createFeatCard(m) : createCard(m)).join('');
}

function filterMovies(genre, search) {
  return moviesList.filter(m => {
    const matchG = genre === 'Todos' || m.genre === genre;
    const matchS = !search || m.title.toLowerCase().includes(search.toLowerCase()) || 
                   m.genre.toLowerCase().includes(search.toLowerCase());
    return matchG && matchS;
  });
}

function renderAll() {
  const filtered = filterMovies(currentGenre, currentSearch);
  const noRes = document.getElementById('no-results');

  if (!filtered.length) {
    noRes.style.display = 'block';
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    return;
  }
  noRes.style.display = 'none';
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'block');

  if (currentGenre === 'Todos' && !currentSearch) {
    // Normal Homepage Mode
    const trending  = moviesList.filter(m => m.badge && m.type === 'Película').slice(0, 8);
    const newMovies = moviesList.filter(m => m.year === 2026 && m.type === 'Película').slice(0, 8);
    const series    = moviesList.filter(m => m.type === 'Serie').slice(0, 4);
    const action    = moviesList.filter(m => m.genre === 'Acción').slice(0, 8);
    const comedy    = moviesList.filter(m => m.genre === 'Comedia').slice(0, 8);

    renderGrid('grid-trending', trending.length ? trending : moviesList.slice(0, 8));
    renderGrid('grid-new', newMovies.length ? newMovies : moviesList.slice(0, 8));
    renderGrid('grid-series', series, 'feat');
    renderGrid('grid-action', action);
    renderGrid('grid-comedy', comedy);

    document.getElementById('sect-series').style.display = 'block';
    document.getElementById('sect-comedy').style.display = 'block';
    document.getElementById('sect-new').style.display = 'block';
    document.getElementById('sect-action').style.display = 'block';

    // Restore original trending title
    const titleEl = document.querySelector('#sect-trending .section-title');
    if (titleEl) titleEl.innerHTML = `<span class="icon">🔥</span> Más Vistos Esta Semana <span class="section-line"></span>`;
  } else {
    // Filtered / Search Results Mode
    renderGrid('grid-trending', filtered);
    renderGrid('grid-new', []);
    renderGrid('grid-series', []);
    renderGrid('grid-action', []);
    renderGrid('grid-comedy', []);

    document.getElementById('sect-series').style.display = 'none';
    document.getElementById('sect-comedy').style.display = 'none';
    document.getElementById('sect-new').style.display = 'none';
    document.getElementById('sect-action').style.display = 'none';

    // Update Section Title
    const titleEl = document.querySelector('#sect-trending .section-title');
    if (titleEl) {
      if (currentSearch) {
        titleEl.innerHTML = `<span class="icon">🔍</span> Resultados para "${currentSearch}" <span class="section-line"></span>`;
      } else {
        titleEl.innerHTML = `<span class="icon">🎬</span> ${currentGenre} <span class="section-line"></span>`;
      }
    }
  }
}

/* ---- ROUTING ---- */
function navigateToMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}

/* ---- SEARCH ---- */
function handleSearch(val) {
  currentSearch = val.trim();
  currentGenre = 'Todos';
  document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
  const firstTab = document.querySelector('.genre-tab');
  if (firstTab) firstTab.classList.add('active');
  renderAll();
}

function toggleSearch() {
  const box = document.getElementById('search-box');
  box.classList.toggle('open');
  if (box.classList.contains('open')) {
    setTimeout(() => document.getElementById('search-input').focus(), 250);
  }
}

/* ---- FILTER GENRE ---- */
function filterByGenre(genre) {
  currentGenre = genre;
  currentSearch = '';
  const searchInp = document.getElementById('search-input');
  const mobSearchInp = document.getElementById('mob-search-input');
  if (searchInp) searchInp.value = '';
  if (mobSearchInp) mobSearchInp.value = '';

  document.querySelectorAll('.genre-tab').forEach(t => {
    const text = t.textContent.trim();
    t.classList.toggle('active', text.includes(genre) || (genre === 'Todos' && text.includes('Todos')));
  });

  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---- MOBILE MENU ---- */
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  menu.classList.toggle('open');
  btn.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

/* ---- TOAST ---- */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---- SCROLL EVENTS ---- */
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-top');
  if (btn) btn.classList.toggle('show', window.scrollY > 400);
});

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  const searchInp = document.getElementById('search-input');
  if (searchInp) {
    searchInp.addEventListener('input', e => handleSearch(e.target.value));
  }
  renderAll();
});
