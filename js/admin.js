/* ============================================================
   CineMax MX — admin.js
   Logic for admin.html (Offline Admin Panel)
============================================================ */

let currentMovies = typeof MOVIES !== 'undefined' ? [...MOVIES] : [];
let activeEpisodeTags = [];

document.addEventListener('DOMContentLoaded', () => {
  renderAdminList();
});

// Helper to find next unique ID
function getNextId() {
  if (currentMovies.length === 0) return 1;
  const ids = currentMovies.map(m => Number(m.id)).filter(id => !isNaN(id));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

// Populate the movie list in admin view
function renderAdminList(searchQuery = '') {
  const container = document.getElementById('admin-movie-list');
  const countBadge = document.getElementById('admin-movie-count');
  if (!container) return;

  const query = searchQuery.trim().toLowerCase();
  const filtered = currentMovies.filter(m => {
    return !query || 
           m.title.toLowerCase().includes(query) || 
           m.genre.toLowerCase().includes(query) ||
           m.type.toLowerCase().includes(query);
  });

  countBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text3); font-size: 13px;">No se encontraron películas.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="admin-movie-item" id="admin-item-${m.id}">
      <div class="admin-movie-emoji">${m.emoji || "🎬"}</div>
      <div class="admin-movie-info">
        <div class="admin-movie-title">${m.title}</div>
        <div class="admin-movie-meta">
          ID: ${m.id} | ${m.genre} | ${m.year} | ⭐ ${m.rating} | ${m.type}
        </div>
      </div>
      <div class="admin-movie-actions">
        <button class="btn-edit" onclick="editMovie(${m.id})">Editar</button>
        <button class="btn-delete" onclick="deleteMovie(${m.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// Toggle visible fields based on Película vs Serie
function toggleEpisodesField() {
  const type = document.getElementById('type').value;
  const epGroup = document.getElementById('episodes-group');
  if (type === 'Serie') {
    epGroup.style.display = 'block';
  } else {
    epGroup.style.display = 'none';
    activeEpisodeTags = [];
    renderEpisodeTags();
  }
}

// Add episode tag inside the form
function addEpisodeTag() {
  const inp = document.getElementById('ep-input');
  const val = inp.value.trim();
  if (val) {
    activeEpisodeTags.push(val);
    inp.value = '';
    renderEpisodeTags();
  }
}

function removeEpisodeTag(idx) {
  activeEpisodeTags.splice(idx, 1);
  renderEpisodeTags();
}

function renderEpisodeTags() {
  const container = document.getElementById('admin-ep-container');
  container.innerHTML = activeEpisodeTags.map((ep, idx) => `
    <span class="admin-ep-tag">
      ${ep}
      <button type="button" class="admin-ep-remove" onclick="removeEpisodeTag(${idx})">✕</button>
    </span>
  `).join('');
}

// Fill form for editing
function editMovie(id) {
  const movie = currentMovies.find(m => Number(m.id) === Number(id));
  if (!movie) return;

  document.getElementById('form-title').textContent = "Editar Película / Serie";
  document.getElementById('movie-id').value = movie.id;
  document.getElementById('title').value = movie.title || '';
  document.getElementById('genre').value = movie.genre || 'Acción';
  document.getElementById('type').value = movie.type || 'Película';
  document.getElementById('year').value = movie.year || 2026;
  document.getElementById('rating').value = movie.rating || 8.5;
  document.getElementById('duration').value = movie.duration || '';
  document.getElementById('emoji').value = movie.emoji || '🎬';
  document.getElementById('yt').value = movie.yt || '';
  document.getElementById('thumb').value = movie.thumb || '';
  document.getElementById('desc').value = movie.desc || '';

  activeEpisodeTags = movie.episodes ? [...movie.episodes] : [];
  toggleEpisodesField();
  renderEpisodeTags();

  // Scroll form into view
  document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth' });
}

// Save or Create movie
function saveMovie() {
  const idVal = document.getElementById('movie-id').value;
  const title = document.getElementById('title').value.trim();
  const genre = document.getElementById('genre').value;
  const type = document.getElementById('type').value;
  const year = parseInt(document.getElementById('year').value);
  const rating = parseFloat(document.getElementById('rating').value);
  const duration = document.getElementById('duration').value.trim();
  const emoji = document.getElementById('emoji').value.trim();
  const yt = document.getElementById('yt').value.trim();
  const thumb = document.getElementById('thumb').value.trim();
  const desc = document.getElementById('desc').value.trim();

  if (!title || !duration || !yt || !desc) {
    showToast("Por favor, llena todos los campos obligatorios.");
    return;
  }

  const movieData = {
    title,
    genre,
    type,
    year: isNaN(year) ? 2026 : year,
    rating: isNaN(rating) ? 8.5 : rating,
    duration,
    emoji: emoji || "🎬",
    yt,
    thumb,
    desc,
    badge: type === 'Serie' ? 'SERIE' : 'NUEVO',
    episodes: type === 'Serie' ? [...activeEpisodeTags] : []
  };

  if (idVal) {
    // Editing existing movie
    const id = parseInt(idVal);
    const idx = currentMovies.findIndex(m => Number(m.id) === id);
    if (idx !== -1) {
      currentMovies[idx] = { ...currentMovies[idx], ...movieData, id };
    }
    showToast("Película actualizada con éxito.");
  } else {
    // Creating new movie
    const newId = getNextId();
    currentMovies.push({ ...movieData, id: newId });
    showToast("¡Nueva película añadida!");
  }

  resetMovieForm();
  renderAdminList();
  showAlert();
}

// Delete movie
function deleteMovie(id) {
  if (confirm(`¿Estás seguro de eliminar el título con ID: ${id}?`)) {
    currentMovies = currentMovies.filter(m => Number(m.id) !== Number(id));
    renderAdminList();
    showToast("Título eliminado.");
    showAlert();
  }
}

// Reset Form state
function resetMovieForm() {
  document.getElementById('form-title').textContent = "Nueva Película / Serie";
  document.getElementById('movie-id').value = '';
  document.getElementById('movie-form').reset();
  activeEpisodeTags = [];
  toggleEpisodesField();
  renderEpisodeTags();
}

// Toast alerts
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// Admin Alert Success Banner
function showAlert() {
  const alertEl = document.getElementById('admin-alert');
  if (alertEl) {
    alertEl.classList.add('show');
    setTimeout(() => {
      alertEl.classList.remove('show');
    }, 6000);
  }
}

// Export the updated MOVIES list as movies.js
function exportMoviesJS() {
  const jsContent = `// Base de datos de películas y series de CineMax MX
const MOVIES = ${JSON.stringify(currentMovies, null, 2)};
`;
  const blob = new Blob([jsContent], { type: 'application/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'movies.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showToast("¡Archivo movies.js exportado con éxito!");
}
