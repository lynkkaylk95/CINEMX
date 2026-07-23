/* ============================================================
   CineMax MX — admin.js
   Logic for admin.html (Offline Admin Panel)
============================================================ */

const MOVIES_STORAGE_KEY = 'cinemax_movies';
const ADMIN_VIEWS_API = 'https://cinemaxmx.com/api/views';
const GENRE_ALIASES = {
  'Học đường': 'Escolar',
  'Xuy\u00EAn kh\u00F4ng': 'Viajes en el tiempo',
  'C\u1ED5 trang': 'De época',
  'Cung đấu': 'Intrigas palaciegas'
};
const ADMIN_GENRE_LABELS = {
  'Acción': 'Hành động',
  'Comedia': 'Hài hước',
  'Drama': 'Chính kịch',
  'Familia': 'Gia đình',
  'Emotivo': 'Cảm động',
  'Ciencia Ficción': 'Viễn tưởng',
  'Romance': 'Lãng mạn',
  'Thriller': 'Gây cấn',
  'Series': 'Phim bộ',
  'Escolar': 'Học đường',
  'Viajes en el tiempo': 'Xuyên không',
  'De época': 'Cổ trang',
  'Intrigas palaciegas': 'Cung đấu'
};
let currentMovies = loadSavedMovies().map(normalizeMovieGenres);
let activeEpisodeTags = [];
let adminMovieViewCounts = {};
let adminViewsLoaded = false;

function getMovieSortValue(movie) {
  const addedTime = Date.parse(movie?.addedAt || movie?.createdAt || '');
  if (!Number.isNaN(addedTime)) return addedTime;
  return Number(movie?.id || 0);
}

function getMovieAddedDate(movie) {
  // Legacy entries 1-37 were imported into the current catalog on 07/07/2026,
  // before individual addedAt timestamps were stored.
  const legacyImportDate = Number(movie?.id) >= 1 && Number(movie?.id) <= 37
    ? '2026-07-07T12:00:00.000Z'
    : '';
  const date = new Date(movie?.addedAt || movie?.createdAt || legacyImportDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMovieAddedDate(movie) {
  const date = getMovieAddedDate(movie);
  return date ? new Intl.DateTimeFormat('vi-VN').format(date) : 'Không rõ';
}

function getLocalDateKey(movie) {
  const date = getMovieAddedDate(movie);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sortMoviesNewestFirst(movies) {
  return [...movies].sort((a, b) => getMovieSortValue(b) - getMovieSortValue(a));
}

function loadSavedMovies() {
  let list = [];
  try {
    const saved = localStorage.getItem(MOVIES_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
  } catch (err) {
    console.warn('Không đọc được danh sách phim đã lưu.', err);
  }
  if (!list.length) list = typeof MOVIES !== 'undefined' ? [...MOVIES] : [];
  return sortMoviesNewestFirst(list);
}

function persistMovies() {
  currentMovies = sortMoviesNewestFirst(currentMovies);
  localStorage.setItem(MOVIES_STORAGE_KEY, JSON.stringify(currentMovies));
}

function extractYouTubeId(value) {
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
  const ytId = extractYouTubeId(raw) || fallbackYtId;
  if (ytId && /(?:youtube\.com|youtu\.be|ytimg\.com|^[A-Za-z0-9_-]{6,})/.test(raw)) {
    return `https://i3.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }
  return raw || (ytId ? `https://i3.ytimg.com/vi/${ytId}/hqdefault.jpg` : '');
}

function isImageSharePageUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'ibb.co'
      || host === 'imgur.com'
      || host === 'postimg.cc'
      || host === 'photos.app.goo.gl';
  } catch (_) {
    return false;
  }
}

function updateThumbnailPreview() {
  const input = document.getElementById('thumb');
  const preview = document.getElementById('admin-thumb-preview');
  const image = document.getElementById('admin-thumb-preview-img');
  const title = document.getElementById('admin-thumb-preview-title');
  const status = document.getElementById('admin-thumb-preview-status');
  if (!input || !preview || !image || !title || !status) return;

  const raw = input.value.trim();
  const fallbackYtId = extractYouTubeId(document.getElementById('yt')?.value);
  const thumbnailUrl = getThumbnailUrl(raw, fallbackYtId);
  input.dataset.imageState = '';

  if (!thumbnailUrl) {
    preview.hidden = true;
    image.removeAttribute('src');
    return;
  }

  preview.hidden = false;
  preview.classList.remove('is-valid', 'is-invalid');

  if (raw && isImageSharePageUrl(raw)) {
    input.dataset.imageState = 'invalid';
    preview.classList.add('is-invalid');
    image.removeAttribute('src');
    title.textContent = 'Đây là link trang chia sẻ, không phải link ảnh';
    status.textContent = 'Hãy sao chép mục “Direct link” từ dịch vụ lưu ảnh.';
    return;
  }

  title.textContent = 'Đang kiểm tra ảnh…';
  status.textContent = thumbnailUrl;
  input.dataset.imageState = 'checking';
  image.onload = () => {
    input.dataset.imageState = 'valid';
    preview.classList.add('is-valid');
    preview.classList.remove('is-invalid');
    title.textContent = 'Ảnh hiển thị hợp lệ';
    status.textContent = 'Ảnh này có thể dùng làm thumbnail.';
  };
  image.onerror = () => {
    input.dataset.imageState = 'invalid';
    preview.classList.add('is-invalid');
    preview.classList.remove('is-valid');
    title.textContent = 'Không tải được ảnh từ liên kết này';
    status.textContent = 'Kiểm tra lại URL hoặc dùng link ảnh trực tiếp.';
  };
  image.src = thumbnailUrl;
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

function getAdminMovieUrl(movie) {
  const slug = movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`;
  return `https://cinemaxmx.com/pelicula/${encodeURIComponent(slug)}`;
}

function getAdminMovieSlug(movie) {
  return movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`;
}

function formatViewNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
}

async function loadAdminMovieViews() {
  const slugs = [...new Set(currentMovies.map(getAdminMovieSlug).filter(Boolean))];
  if (!slugs.length) return;
  const viewFilter = document.getElementById('admin-view-filter');

  try {
    const batches = [];
    for (let index = 0; index < slugs.length; index += 80) {
      batches.push(slugs.slice(index, index + 80));
    }
    const results = await Promise.all(batches.map(async batch => {
      const response = await fetch(`${ADMIN_VIEWS_API}?slugs=${encodeURIComponent(batch.join(','))}`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Views API: ${response.status}`);
      return response.json();
    }));
    adminMovieViewCounts = Object.assign({}, ...results.map(data => data.views || {}));
    adminViewsLoaded = true;
    if (viewFilter) {
      viewFilter.disabled = false;
      viewFilter.options[0].textContent = 'Mặc định';
    }
    renderAdminList();
  } catch (error) {
    console.warn('Không thể tải lượt xem phim.', error);
    if (viewFilter) {
      viewFilter.disabled = true;
      viewFilter.value = '';
      viewFilter.options[0].textContent = 'Không tải được lượt xem';
    }
    renderAdminList();
  }
}

async function copyMovieVideoLink(id) {
  const movie = currentMovies.find(m => Number(m.id) === Number(id));
  if (!movie) {
    showToast('Không tìm thấy phim.');
    return;
  }
  const movieUrl = getAdminMovieUrl(movie);

  try {
    await navigator.clipboard.writeText(movieUrl);
  } catch (err) {
    const input = document.createElement('textarea');
    input.value = movieUrl;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }

  showToast('Đã sao chép liên kết phim!');
}

function syncThumbnailFromYouTube() {
  const ytInput = document.getElementById('yt');
  const thumbInput = document.getElementById('thumb');
  if (!ytInput || !thumbInput) return;

  const ytId = extractYouTubeId(ytInput.value);
  if (!ytId) return;

  if (!thumbInput.value.trim() || /(?:youtube\.com|youtu\.be|ytimg\.com)/.test(thumbInput.value)) {
    thumbInput.value = `https://i3.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }
  updateThumbnailPreview();
}

function findDuplicateMovieByVideo(ytId, ignoredId = null) {
  const normalizedYtId = String(ytId || '').trim();
  if (!normalizedYtId) return null;

  return currentMovies.find(movie => {
    if (ignoredId !== null && Number(movie.id) === Number(ignoredId)) return false;
    return extractYouTubeId(movie?.yt) === normalizedYtId;
  }) || null;
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
  return getMovieGenres(movie).map(genre => ADMIN_GENRE_LABELS[genre] || genre).join(' • ') || '-';
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

function normalizeMovieGenres(movie) {
  const genres = getMovieGenres(movie);
  const normalizedGenres = genres.length ? genres : ['Acción'];
  return {
    ...movie,
    genre: movie?.genre || normalizedGenres[0],
    genres: normalizedGenres,
    slug: movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`,
    thumb: isImageSharePageUrl(movie?.thumb)
      ? getThumbnailUrl('', extractYouTubeId(movie?.yt))
      : movie?.thumb
  };
}

function getSelectedGenres() {
  return [...document.querySelectorAll('input[name="genres"]:checked')].map(input => input.value);
}

function setSelectedGenres(genres) {
  const selected = new Set(genres && genres.length ? genres : ['Acción']);
  document.querySelectorAll('input[name="genres"]').forEach(input => {
    input.checked = selected.has(input.value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setSelectedGenres(['Acción']);
  const ytInput = document.getElementById('yt');
  if (ytInput) {
    ytInput.addEventListener('input', syncThumbnailFromYouTube);
    ytInput.addEventListener('paste', () => setTimeout(syncThumbnailFromYouTube, 0));
  }
  const thumbInput = document.getElementById('thumb');
  if (thumbInput) {
    thumbInput.addEventListener('input', updateThumbnailPreview);
    thumbInput.addEventListener('paste', () => setTimeout(updateThumbnailPreview, 0));
  }
  populateAdminGenreFilter();
  renderAdminList();
  loadAdminMovieViews();
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

  const searchInput = document.getElementById('admin-search');
  const query = String(searchQuery || searchInput?.value || '').trim().toLowerCase();
  const addedDate = document.getElementById('admin-date-filter')?.value || '';
  const genre = document.getElementById('admin-genre-filter')?.value || '';
  const viewOrder = document.getElementById('admin-view-filter')?.value || '';
  const filtered = currentMovies.filter(m => {
    const matchesQuery = !query ||
      String(m.title || '').toLowerCase().includes(query) ||
      getGenreLabel(m).toLowerCase().includes(query) ||
      String(m.type || '').toLowerCase().includes(query);
    const matchesDate = !addedDate || getLocalDateKey(m) === addedDate;
    const matchesGenre = !genre || getMovieGenres(m).includes(genre);
    return matchesQuery && matchesDate && matchesGenre;
  });

  const sorted = viewOrder
    ? [...filtered].sort((a, b) => {
        const difference = (adminMovieViewCounts[getAdminMovieSlug(b)] || 0) -
          (adminMovieViewCounts[getAdminMovieSlug(a)] || 0);
        return viewOrder === 'asc' ? -difference : difference;
      })
    : sortMoviesNewestFirst(filtered);
  countBadge.textContent = sorted.length;

  if (sorted.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text3); font-size: 13px;">Không tìm thấy phim nào.</div>`;
    return;
  }

  container.innerHTML = sorted.map(m => {
    const thumbnailUrl = getThumbnailUrl(m.thumb, extractYouTubeId(m.yt));
    const movieUrl = getAdminMovieUrl(m);
    const views = adminMovieViewCounts[getAdminMovieSlug(m)] || 0;
    return `
    <div class="admin-movie-item" id="admin-item-${m.id}">
      <div class="admin-movie-thumb">
        ${thumbnailUrl
          ? `<img src="${escapeHTML(thumbnailUrl)}" alt="" loading="lazy">`
          : `<span>${escapeHTML(m.emoji || "🎬")}</span>`}
      </div>
      <div class="admin-movie-info">
        <div class="admin-movie-title">${escapeHTML(m.title)}</div>
        <div class="admin-movie-meta">
          ID: ${escapeHTML(m.id)} | ${escapeHTML(getGenreLabel(m))} | ${escapeHTML(m.year)} | ⭐ ${escapeHTML(m.rating)} | ${escapeHTML(m.type)}
        </div>
        <div class="admin-movie-extra">
          <span>Ngày thêm: <strong>${escapeHTML(formatMovieAddedDate(m))}</strong></span>
          <span>Lượt xem: <strong>${adminViewsLoaded ? escapeHTML(formatViewNumber(views)) : 'Đang tải...'}</strong></span>
        </div>
      </div>
      <div class="admin-movie-actions">
        <button type="button" class="btn-copy-video" onclick="copyMovieVideoLink(${Number(m.id)})">Sao chép link</button>
        <a class="btn-view-movie" href="${escapeHTML(movieUrl)}" target="_blank" rel="noopener noreferrer">Xem phim</a>
        <button class="btn-edit" onclick="editMovie(${m.id})">Sửa</button>
        <button class="btn-delete" onclick="deleteMovie(${m.id})">Xóa</button>
      </div>
    </div>
  `;
  }).join('');
}

function populateAdminGenreFilter() {
  const select = document.getElementById('admin-genre-filter');
  if (!select) return;
  const genres = [...new Set(currentMovies.flatMap(getMovieGenres))].sort((a, b) =>
    (ADMIN_GENRE_LABELS[a] || a).localeCompare(ADMIN_GENRE_LABELS[b] || b, 'vi')
  );
  select.innerHTML = '<option value="">Tất cả thể loại</option>' + genres.map(genre =>
    `<option value="${escapeHTML(genre)}">${escapeHTML(ADMIN_GENRE_LABELS[genre] || genre)}</option>`
  ).join('');
}

function resetAdminFilters() {
  ['admin-search', 'admin-date-filter', 'admin-genre-filter', 'admin-view-filter'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });
  renderAdminList();
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

// Remove episode tag
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

  document.getElementById('form-title').textContent = "Chỉnh sửa Phim / Series";
  document.getElementById('movie-id').value = movie.id;
  document.getElementById('title').value = movie.title || '';
  setSelectedGenres(getMovieGenres(movie));
  document.getElementById('type').value = movie.type || 'Película';
  document.getElementById('year').value = movie.year || 2026;
  document.getElementById('rating').value = movie.rating || 8.5;
  document.getElementById('duration').value = movie.duration || '';
  document.getElementById('yt').value = movie.yt || '';
  document.getElementById('thumb').value = movie.thumb || '';
  document.getElementById('desc').value = movie.desc || '';

  activeEpisodeTags = movie.episodes ? [...movie.episodes] : [];
  toggleEpisodesField();
  renderEpisodeTags();
  updateThumbnailPreview();

  // Scroll form into view
  document.querySelector('.admin-form-card').scrollIntoView({ behavior: 'smooth' });
}

// Save or Create movie
function saveMovie() {
  const idVal = document.getElementById('movie-id').value;
  const title = document.getElementById('title').value.trim();
  const genres = getSelectedGenres();
  const type = document.getElementById('type').value;
  const year = parseInt(document.getElementById('year').value);
  const rating = parseFloat(document.getElementById('rating').value);
  const duration = document.getElementById('duration').value.trim();
  const yt = extractYouTubeId(document.getElementById('yt').value);
  const thumbInput = document.getElementById('thumb');
  const rawThumb = thumbInput.value.trim();
  const thumb = getThumbnailUrl(rawThumb, yt);
  const desc = document.getElementById('desc').value.trim();

  if (!title || !duration || !yt || !desc || genres.length === 0) {
    showToast("Vui lòng điền đầy đủ các trường bắt buộc.");
    return;
  }
  if (rawThumb && (isImageSharePageUrl(rawThumb) || thumbInput.dataset.imageState === 'invalid' || thumbInput.dataset.imageState === 'checking')) {
    showToast(thumbInput.dataset.imageState === 'checking'
      ? "Ảnh đang được kiểm tra. Vui lòng đợi một chút."
      : "Link ảnh bìa không hợp lệ. Hãy dùng link ảnh trực tiếp.");
    thumbInput.focus();
    return;
  }

  const duplicateMovie = findDuplicateMovieByVideo(yt, idVal ? parseInt(idVal) : null);
  if (duplicateMovie) {
    showToast(`Link video \u0111\u00e3 tr\u00f9ng v\u1edbi phim "${duplicateMovie.title}". Kh\u00f4ng th\u1ec3 l\u01b0u.`);
    document.getElementById('yt').focus();
    return;
  }

  const movieData = {
    title,
    slug: slugify(title),
    genre: genres[0],
    genres,
    type,
    year: isNaN(year) ? 2026 : year,
    rating: isNaN(rating) ? 8.5 : rating,
    duration,
    emoji: "🎬",
    yt,
    thumb,
    desc,
    episodes: type === 'Serie' ? [...activeEpisodeTags] : []
  };

  if (idVal) {
    // Editing existing movie
    const id = parseInt(idVal);
    const idx = currentMovies.findIndex(m => Number(m.id) === id);
    if (idx !== -1) {
      currentMovies[idx] = { ...currentMovies[idx], ...movieData, id };
    }
    showToast("Cập nhật phim thành công.");
  } else {
    // Creating new movie
    const newId = getNextId();
    currentMovies.unshift({ ...movieData, id: newId, addedAt: new Date().toISOString() });
    showToast("Đã thêm phim mới thành công!");
  }

  resetMovieForm();
  persistMovies();
  renderAdminList();
  showAlert();
}

// Delete movie
function deleteMovie(id) {
  if (confirm(`Bạn có chắc chắn muốn xóa phim có ID: ${id}?`)) {
    currentMovies = currentMovies.filter(m => Number(m.id) !== Number(id));
    persistMovies();
    renderAdminList();
    showToast("Đã xóa phim.");
    showAlert();
  }
}

// Reset Form state
function resetMovieForm() {
  document.getElementById('form-title').textContent = "Thêm Phim / Series Mới";
  document.getElementById('movie-id').value = '';
  document.getElementById('movie-form').reset();
  setSelectedGenres(['Acción']);
  activeEpisodeTags = [];
  toggleEpisodesField();
  renderEpisodeTags();
  updateThumbnailPreview();
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
  currentMovies = sortMoviesNewestFirst(currentMovies);
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
  URL.revokeObjectURL(url);

  showToast("Xuất file movies.js thành công!");
}

