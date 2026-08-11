/* ============================================================
   CineMax MX — admin.js
   Logic for admin.html (Offline Admin Panel)
============================================================ */

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
let currentMovies = [];
let activeEpisodeTags = [];
let adminMovieViewCounts = {};
let adminViewsLoaded = false;
let currentAdminSession = null;
let adminUsers = [];

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

async function adminRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) showLogin();
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.code = data.error;
    throw error;
  }
  return data;
}

function showLogin(message = '') {
  document.getElementById('admin-login-screen').hidden = false;
  document.getElementById('admin-reset-screen').hidden = true;
  document.getElementById('admin-page').hidden = true;
  document.getElementById('admin-login-error').textContent = message;
}

function showAdmin(session = currentAdminSession) {
  currentAdminSession = session || currentAdminSession;
  document.getElementById('admin-login-screen').hidden = true;
  document.getElementById('admin-page').hidden = false;
  const usersNav = document.getElementById('admin-users-nav');
  if (usersNav) usersNav.hidden = !currentAdminSession?.isRoot;
  if (!currentAdminSession?.isRoot) switchAdminView('movies');
}

function switchAdminView(view) {
  if (view === 'users' && !currentAdminSession?.isRoot) return;
  const isUsers = view === 'users';
  document.getElementById('admin-movies-view').hidden = isUsers;
  document.getElementById('admin-users-view').hidden = !isUsers;
  document.getElementById('admin-page-title').textContent = isUsers ? 'Quản lý tài khoản' : 'Thêm / Chỉnh Sửa Phim và Series';
  document.querySelectorAll('.admin-nav-btn').forEach(button => button.classList.toggle('is-active', button.dataset.adminView === view));
  if (isUsers) loadAdminUsers();
}

function resetAdminUserForm() {
  document.getElementById('admin-user-form').reset();
  document.getElementById('admin-user-id').value = '';
  document.getElementById('admin-user-form-title').textContent = 'Thêm người quản lý';
  document.getElementById('admin-user-submit').textContent = 'Thêm người quản lý';
  document.getElementById('admin-user-password').required = true;
  document.getElementById('admin-user-password-required').hidden = false;
  document.getElementById('admin-user-cancel').hidden = true;
  document.getElementById('admin-user-error').textContent = '';
}

function renderAdminUsers() {
  const list = document.getElementById('admin-user-list');
  document.getElementById('admin-user-count').textContent = adminUsers.length;
  if (!adminUsers.length) {
    list.innerHTML = '<div class="admin-users-empty">Chưa có người quản lý phụ.</div>';
    return;
  }
  list.innerHTML = adminUsers.map(user => `
    <article class="admin-user-row">
      <div class="admin-user-avatar">${escapeHTML((user.name || user.email).slice(0, 1).toUpperCase())}</div>
      <div class="admin-user-info"><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span><small>Thêm ngày ${escapeHTML(new Intl.DateTimeFormat('vi-VN').format(new Date(user.createdAt)))}</small></div>
      <div class="admin-user-actions"><button type="button" class="admin-user-edit" data-user-id="${user.id}">Sửa</button><button type="button" class="admin-user-delete" data-user-id="${user.id}">Xóa</button></div>
    </article>`).join('');
}

async function loadAdminUsers() {
  try {
    const data = await adminRequest('/api/admin/users');
    adminUsers = data.users || [];
    renderAdminUsers();
  } catch (error) {
    showToast(error.code === 'root_admin_required' ? 'Chỉ admin gốc được quản lý tài khoản.' : 'Không thể tải danh sách người quản lý.');
  }
}

function editAdminUser(id) {
  const user = adminUsers.find(item => Number(item.id) === Number(id));
  if (!user) return;
  document.getElementById('admin-user-id').value = user.id;
  document.getElementById('admin-user-name').value = user.name;
  document.getElementById('admin-user-email').value = user.email;
  document.getElementById('admin-user-password').value = '';
  document.getElementById('admin-user-password').required = false;
  document.getElementById('admin-user-password-required').hidden = true;
  document.getElementById('admin-user-form-title').textContent = 'Chỉnh sửa người quản lý';
  document.getElementById('admin-user-submit').textContent = 'Lưu thay đổi';
  document.getElementById('admin-user-cancel').hidden = false;
  document.getElementById('admin-user-name').focus();
}

async function deleteAdminUser(id) {
  const user = adminUsers.find(item => Number(item.id) === Number(id));
  if (!user || !confirm(`Xóa tài khoản ${user.name} (${user.email})? Tài khoản này sẽ không thể đăng nhập nữa.`)) return;
  try {
    await adminRequest(`/api/admin/users/${Number(id)}`, { method: 'DELETE' });
    adminUsers = adminUsers.filter(item => Number(item.id) !== Number(id));
    if (Number(document.getElementById('admin-user-id').value) === Number(id)) resetAdminUserForm();
    renderAdminUsers();
    showToast('Đã xóa người quản lý.');
  } catch (_) { showToast('Không thể xóa người quản lý.'); }
}

async function loadOnlineMovies() {
  const data = await adminRequest('/api/admin/movies');
  currentMovies = sortMoviesNewestFirst((data.movies || []).map(normalizeMovieGenres));
  document.getElementById('admin-import-legacy').hidden = currentMovies.length > 0;
  populateAdminGenreFilter();
  renderAdminList();
  await loadAdminMovieViews();
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

document.addEventListener('DOMContentLoaded', async () => {
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
  const loginForm = document.getElementById('admin-login-form');
  const resetToken = new URLSearchParams(location.search).get('reset');
  if (resetToken) {
    document.getElementById('admin-login-screen').hidden = true;
    document.getElementById('admin-reset-screen').hidden = false;
  }
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const error = document.getElementById('admin-login-error');
    const button = loginForm.querySelector('button[type="submit"]');
    error.textContent = '';
    button.disabled = true;
    try {
      const session = await adminRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('admin-username').value,
          password: document.getElementById('admin-password').value
        })
      });
      document.getElementById('admin-password').value = '';
      showAdmin(session);
      await loadOnlineMovies();
    } catch (loginError) {
      const messages = {
        invalid_credentials: 'Tên đăng nhập hoặc mật khẩu không đúng.',
        too_many_attempts: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
        admin_not_configured: 'Tài khoản quản trị chưa được cấu hình trên Cloudflare.'
      };
      error.textContent = messages[loginError.code] || 'Không thể đăng nhập. Vui lòng thử lại.';
    } finally {
      button.disabled = false;
    }
  });
  document.getElementById('admin-forgot-password').addEventListener('click', async event => {
    const username = document.getElementById('admin-username').value.trim() || 'Admin';
    const error = document.getElementById('admin-login-error');
    event.currentTarget.disabled = true;
    try {
      await adminRequest('/api/admin/forgot-password', {
        method: 'POST', body: JSON.stringify({ username })
      });
      error.style.color = '#8edb9b';
      error.textContent = 'Nếu tài khoản hợp lệ, liên kết đặt lại đã được gửi tới email khôi phục.';
    } catch (forgotError) {
      error.style.color = '';
      error.textContent = forgotError.code === 'password_recovery_not_configured'
        ? 'Email khôi phục chưa được cấu hình trên Cloudflare.'
        : 'Chưa thể gửi email. Vui lòng thử lại sau.';
    } finally {
      event.currentTarget.disabled = false;
    }
  });
  document.getElementById('admin-reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.getElementById('admin-new-password').value;
    const confirmation = document.getElementById('admin-confirm-password').value;
    const error = document.getElementById('admin-reset-error');
    if (password !== confirmation) {
      error.textContent = 'Hai mật khẩu không giống nhau.';
      return;
    }
    try {
      await adminRequest('/api/admin/reset-password', {
        method: 'POST', body: JSON.stringify({ token: resetToken, password })
      });
      history.replaceState({}, '', '/admin');
      showLogin('Đã đổi mật khẩu. Bạn có thể đăng nhập ngay.');
      document.getElementById('admin-username').value = 'Admin';
    } catch (resetError) {
      error.textContent = resetError.code === 'invalid_or_expired_token'
        ? 'Liên kết đã hết hạn hoặc đã được sử dụng.'
        : 'Không thể đổi mật khẩu. Vui lòng thử lại.';
    }
  });
  document.getElementById('admin-logout').addEventListener('click', async () => {
    try { await adminRequest('/api/admin/logout', { method: 'POST' }); } catch (_) {}
    currentMovies = [];
    switchAdminView('movies');
    currentAdminSession = null;
    adminUsers = [];
    showLogin('Đã đăng xuất.');
  });
  document.querySelectorAll('.admin-nav-btn').forEach(button => button.addEventListener('click', () => switchAdminView(button.dataset.adminView)));
  document.getElementById('admin-user-cancel').addEventListener('click', resetAdminUserForm);
  document.getElementById('admin-user-list').addEventListener('click', event => {
    const button = event.target.closest('[data-user-id]');
    if (!button) return;
    if (button.classList.contains('admin-user-edit')) editAdminUser(button.dataset.userId);
    if (button.classList.contains('admin-user-delete')) deleteAdminUser(button.dataset.userId);
  });
  document.getElementById('admin-user-form').addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('admin-user-id').value;
    const button = document.getElementById('admin-user-submit');
    const error = document.getElementById('admin-user-error');
    const payload = {
      name: document.getElementById('admin-user-name').value.trim(),
      email: document.getElementById('admin-user-email').value.trim(),
      password: document.getElementById('admin-user-password').value
    };
    error.textContent = '';
    button.disabled = true;
    try {
      const data = await adminRequest(id ? `/api/admin/users/${Number(id)}` : '/api/admin/users', {
        method: id ? 'PUT' : 'POST', body: JSON.stringify(payload)
      });
      if (id) adminUsers = adminUsers.map(user => Number(user.id) === Number(id) ? data.user : user);
      else adminUsers.unshift(data.user);
      renderAdminUsers();
      resetAdminUserForm();
      showToast(id ? 'Đã cập nhật người quản lý.' : 'Đã thêm người quản lý mới.');
    } catch (saveError) {
      const messages = { duplicate_email: 'Email này đã được sử dụng.', root_account_reserved: 'Không thể sử dụng tài khoản của admin gốc.', invalid_user: 'Vui lòng nhập đúng email và mật khẩu ít nhất 10 ký tự.' };
      error.textContent = messages[saveError.code] || 'Không thể lưu người quản lý. Vui lòng thử lại.';
    } finally { button.disabled = false; }
  });
  document.getElementById('admin-import-legacy').addEventListener('click', async event => {
    if (!confirm('Nhập toàn bộ phim hiện có trong movies.js vào cơ sở dữ liệu online?')) return;
    event.currentTarget.disabled = true;
    try {
      const data = await adminRequest('/api/admin/import-legacy', { method: 'POST' });
      showToast(`Đã nhập ${data.imported} phim vào cơ sở dữ liệu.`);
      await loadOnlineMovies();
    } catch (_) {
      showToast('Không thể nhập dữ liệu cũ. Cơ sở dữ liệu có thể đã chứa phim.');
    } finally {
      event.currentTarget.disabled = false;
    }
  });

  if (resetToken) return;

  try {
    const session = await adminRequest('/api/admin/session');
    showAdmin(session);
    await loadOnlineMovies();
  } catch (_) {
    showLogin();
  }
});

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
async function saveMovie() {
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

  const button = document.getElementById('btn-submit');
  button.disabled = true;
  try {
    const data = await adminRequest(idVal ? `/api/admin/movies/${Number(idVal)}` : '/api/admin/movies', {
      method: idVal ? 'PUT' : 'POST',
      body: JSON.stringify(movieData)
    });
    if (idVal) {
      const index = currentMovies.findIndex(movie => Number(movie.id) === Number(idVal));
      if (index !== -1) currentMovies[index] = normalizeMovieGenres(data.movie);
      showToast("Cập nhật phim thành công.");
    } else {
      currentMovies.unshift(normalizeMovieGenres(data.movie));
      showToast("Đã thêm phim mới thành công!");
    }
    resetMovieForm();
    currentMovies = sortMoviesNewestFirst(currentMovies);
    populateAdminGenreFilter();
    renderAdminList();
    showAlert();
  } catch (error) {
    showToast(error.code === 'duplicate_slug_or_video'
      ? 'Tên phim hoặc video đã tồn tại.'
      : 'Không thể lưu phim. Vui lòng thử lại.');
  } finally {
    button.disabled = false;
  }
}

// Delete movie
async function deleteMovie(id) {
  if (confirm(`Bạn có chắc chắn muốn xóa phim có ID: ${id}?`)) {
    try {
      await adminRequest(`/api/admin/movies/${Number(id)}`, { method: 'DELETE' });
      currentMovies = currentMovies.filter(m => Number(m.id) !== Number(id));
      populateAdminGenreFilter();
      renderAdminList();
      showToast("Đã xóa phim.");
      showAlert();
    } catch (_) {
      showToast('Không thể xóa phim. Vui lòng thử lại.');
    }
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

