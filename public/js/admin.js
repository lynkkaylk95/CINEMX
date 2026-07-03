/* ============================================================
   CineMax MX — admin.js
   Logic for admin.html (Offline Admin Panel)
============================================================ */

const MOVIES_STORAGE_KEY = 'cinemax_movies';
const GENRE_ALIASES = {
  'Học đường': 'Escolar',
  'Xuyên không': 'Viajes en el tiempo',
  'Cổ trang': 'De época',
  'Cung đấu': 'Intrigas palaciegas'
};
const ADMIN_GENRE_LABELS = {
  'Acción': 'Hành động',
  'Comedia': 'Hài hước',
  'Drama': 'Chính kịch',
  'Terror': 'Kinh dị',
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
let videoCheckTimer = null;
let youtubeApiPromise = null;
let videoCheckState = {
  status: 'idle',
  videoId: '',
  data: null,
  requestId: 0
};
let youtubeProbePlayer = null;

function loadSavedMovies() {
  try {
    const saved = localStorage.getItem(MOVIES_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('Không đọc được danh sách phim đã lưu.', err);
  }
  return typeof MOVIES !== 'undefined' ? [...MOVIES] : [];
}

function persistMovies() {
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

function formatVideoDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}min`;
  return `${minutes || 1}min`;
}

function getYouTubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function getYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1'
  });
  if (window.location.origin && window.location.origin !== 'null') {
    params.set('origin', window.location.origin);
  }
  if (window.location.href && !window.location.href.startsWith('file:')) {
    params.set('widget_referrer', window.location.href);
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function setVideoCheckStatus(status, message) {
  const btn = document.getElementById('video-check-btn');
  const details = document.getElementById('video-check-details');
  const submitBtn = document.getElementById('btn-submit');
  const labels = {
    idle: 'Chưa kiểm tra video',
    checking: 'Đang kiểm tra video...',
    ok: 'Video có thể sử dụng',
    bad: 'Video không thể sử dụng'
  };

  if (btn) {
    btn.textContent = labels[status] || labels.idle;
    btn.className = `video-check-btn ${status}`;
  }
  if (details) details.textContent = message || '';
  if (submitBtn) submitBtn.disabled = status !== 'ok';
}

function resetYouTubeProbe() {
  const probe = document.getElementById('youtube-probe');
  try {
    if (youtubeProbePlayer && typeof youtubeProbePlayer.destroy === 'function') {
      youtubeProbePlayer.destroy();
    }
  } catch (err) {
    console.warn('Không thể dọn trình kiểm tra YouTube.', err);
  }
  youtubeProbePlayer = null;
  if (probe) probe.innerHTML = '';
}

function markVideoCheckIdle(message = 'Dán link YouTube để tự lấy tên, thumbnail, thời lượng và kiểm tra nhúng.') {
  videoCheckState = {
    ...videoCheckState,
    status: 'idle',
    videoId: '',
    data: null,
    requestId: videoCheckState.requestId + 1
  };
  resetYouTubeProbe();
  setVideoCheckStatus('idle', message);
}

function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error('Không tải được YouTube IFrame API.')), 12000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (typeof previousReady === 'function') previousReady();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Không tải được YouTube IFrame API.'));
      };
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

async function fetchYouTubeOEmbed(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(getYouTubeWatchUrl(videoId))}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Không lấy được thông tin video từ YouTube.');
  return res.json();
}

async function probeYouTubeEmbed(videoId) {
  const YTApi = await loadYouTubeIframeAPI();
  const probe = document.getElementById('youtube-probe');
  if (!probe) throw new Error('Không tìm thấy vùng kiểm tra video.');
  resetYouTubeProbe();

  return new Promise((resolve) => {
    const holderId = `yt-probe-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    let player = null;
    let settled = false;
    let durationPoll = null;
    probe.innerHTML = `<div id="${holderId}"></div>`;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (durationPoll) window.clearInterval(durationPoll);
      if (result.ok) {
        youtubeProbePlayer = player;
      } else {
        try {
          if (player && typeof player.destroy === 'function') player.destroy();
        } catch (err) {
          console.warn('Không thể dọn trình kiểm tra YouTube.', err);
        }
        if (probe) probe.innerHTML = '';
      }
      resolve(result);
    };

    const timeout = window.setTimeout(() => {
      finish({
        ok: false,
        duration: 0,
        reason: 'Không kiểm tra được trình phát YouTube. Vui lòng thử lại sau.'
      });
    }, 12000);

    probe.innerHTML = `
      <iframe
        id="${holderId}"
        src="${getYouTubeEmbedUrl(videoId)}"
        title="Kiểm tra video YouTube"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
        frameborder="0"></iframe>
    `;

    player = new YTApi.Player(holderId, {
      events: {
        onReady: (event) => {
          let attempts = 0;
          const readDuration = () => event.target && typeof event.target.getDuration === 'function'
            ? Number(event.target.getDuration()) || 0
            : 0;

          durationPoll = window.setInterval(() => {
            const duration = readDuration();
            attempts += 1;
            if (duration > 0 || attempts >= 18) {
              finish({ ok: true, duration });
            }
          }, 250);
        },
        onError: (event) => {
          const code = Number(event?.data);
          if (code === 101 || code === 150) {
            finish({ ok: false, code, reason: 'Chủ video không cho phép nhúng trên website.' });
            return;
          }
          const reason = code === 153
            ? 'YouTube từ chối phát trong khung nhúng. Video này không nên lưu.'
            : 'Video không tồn tại, bị riêng tư hoặc YouTube từ chối phát.';
          finish({ ok: false, code, reason });
        }
      }
    });
  });
}

function fillVideoMetadata(videoId, metadata, embedResult) {
  const titleInput = document.getElementById('title');
  const ytInput = document.getElementById('yt');
  const thumbInput = document.getElementById('thumb');
  const durationInput = document.getElementById('duration');
  const thumbUrl = metadata?.thumbnail_url || `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const duration = formatVideoDuration(embedResult?.duration);

  if (ytInput) ytInput.value = videoId;
  if (titleInput && metadata?.title && (!titleInput.value.trim() || titleInput.dataset.autoFilled === '1')) {
    titleInput.value = metadata.title;
    titleInput.dataset.autoFilled = '1';
  }
  if (thumbInput && (!thumbInput.value.trim() || thumbInput.dataset.autoFilled === '1')) {
    thumbInput.value = thumbUrl;
    thumbInput.dataset.autoFilled = '1';
  }
  if (durationInput && duration && (!durationInput.value.trim() || durationInput.dataset.autoFilled === '1')) {
    durationInput.value = duration;
    durationInput.dataset.autoFilled = '1';
  }
}

function clearAutoFilledVideoMetadata() {
  ['title', 'thumb', 'duration'].forEach(id => {
    const input = document.getElementById(id);
    if (input && input.dataset.autoFilled === '1') {
      input.value = '';
      input.dataset.autoFilled = '0';
    }
  });
}

async function checkYouTubeVideoNow() {
  const ytInput = document.getElementById('yt');
  if (!ytInput) return;

  const videoId = extractYouTubeId(ytInput.value);
  if (!videoId) {
    markVideoCheckIdle('Dán link YouTube hợp lệ để hệ thống kiểm tra trước khi lưu.');
    return;
  }

  const requestId = videoCheckState.requestId + 1;
  videoCheckState = { status: 'checking', videoId, data: null, requestId };
  setVideoCheckStatus('checking', `Đang kiểm tra video ${videoId}...`);

  try {
    const [metadataResult, embedResult] = await Promise.allSettled([
      fetchYouTubeOEmbed(videoId),
      probeYouTubeEmbed(videoId)
    ]);
    if (videoCheckState.requestId !== requestId) return;

    const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
    if (!metadata) {
      clearAutoFilledVideoMetadata();
      videoCheckState = { status: 'bad', videoId, data: null, requestId };
      setVideoCheckStatus('bad', metadataResult.reason?.message || 'Không lấy được thông tin video từ YouTube.');
      return;
    }

    const embedData = embedResult.status === 'fulfilled' ? embedResult.value : {
      ok: false,
      duration: 0,
      reason: embedResult.reason?.message || 'Không kiểm tra được trình phát YouTube.'
    };
    if (!embedData.ok) {
      clearAutoFilledVideoMetadata();
      videoCheckState = { status: 'bad', videoId, data: null, requestId };
      setVideoCheckStatus('bad', embedData.reason || 'Video này không thể nhúng trên website.');
      return;
    }

    fillVideoMetadata(videoId, metadata, embedData);
    videoCheckState = {
      status: 'ok',
      videoId,
      data: {
        title: metadata.title || '',
        thumb: metadata.thumbnail_url || '',
        duration: formatVideoDuration(embedData.duration)
      },
      requestId
    };
    setVideoCheckStatus('ok', embedData.warning || 'Đã lấy tên video, thumbnail, thời lượng và xác nhận video cho phép nhúng.');
  } catch (err) {
    if (videoCheckState.requestId !== requestId) return;
    videoCheckState = { status: 'bad', videoId, data: null, requestId };
    setVideoCheckStatus('bad', err?.message || 'Không thể kiểm tra video này.');
  }
}

function scheduleYouTubeVideoCheck() {
  window.clearTimeout(videoCheckTimer);
  const value = document.getElementById('yt')?.value || '';
  if (!value.trim()) {
    markVideoCheckIdle();
    return;
  }
  clearAutoFilledVideoMetadata();
  videoCheckState = {
    ...videoCheckState,
    status: 'checking',
    videoId: extractYouTubeId(value),
    data: null,
    requestId: videoCheckState.requestId + 1
  };
  setVideoCheckStatus('checking', 'Đợi một chút, hệ thống sẽ kiểm tra video này.');
  videoCheckTimer = window.setTimeout(checkYouTubeVideoNow, 550);
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
    slug: movie?.slug || slugify(movie?.title) || `pelicula-${movie?.id || ''}`
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
  markVideoCheckIdle();
  const ytInput = document.getElementById('yt');
  const autoInputs = ['title', 'thumb', 'duration'].map(id => document.getElementById(id)).filter(Boolean);
  if (ytInput) ytInput.addEventListener('input', scheduleYouTubeVideoCheck);
  autoInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.dataset.autoFilled = '0';
    });
  });
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
           getGenreLabel(m).toLowerCase().includes(query) ||
           m.type.toLowerCase().includes(query);
  });

  countBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text3); font-size: 13px;">Không tìm thấy phim nào.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="admin-movie-item" id="admin-item-${m.id}">
      <div class="admin-movie-emoji">${m.emoji || "🎬"}</div>
      <div class="admin-movie-info">
        <div class="admin-movie-title">${m.title}</div>
        <div class="admin-movie-meta">
          ID: ${m.id} | ${getGenreLabel(m)} | ${m.year} | ⭐ ${m.rating} | ${m.type}
        </div>
      </div>
      <div class="admin-movie-actions">
        <button class="btn-edit" onclick="editMovie(${m.id})">Sửa</button>
        <button class="btn-delete" onclick="deleteMovie(${m.id})">Xóa</button>
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
  document.getElementById('emoji').value = movie.emoji || '🎬';
  document.getElementById('yt').value = movie.yt || '';
  document.getElementById('thumb').value = movie.thumb || '';
  document.getElementById('desc').value = movie.desc || '';
  ['title', 'thumb', 'duration'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.dataset.autoFilled = '0';
  });
  markVideoCheckIdle('Video hiện có sẽ được kiểm tra lại nếu bạn bấm lưu hoặc thay link.');
  if (movie.yt) scheduleYouTubeVideoCheck();

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
  const genres = getSelectedGenres();
  const type = document.getElementById('type').value;
  const year = parseInt(document.getElementById('year').value);
  const rating = parseFloat(document.getElementById('rating').value);
  const duration = document.getElementById('duration').value.trim();
  const emoji = document.getElementById('emoji').value.trim();
  const yt = extractYouTubeId(document.getElementById('yt').value);
  const thumb = getThumbnailUrl(document.getElementById('thumb').value, yt);
  const desc = document.getElementById('desc').value.trim();

  if (!title || !duration || !yt || !desc || genres.length === 0) {
    showToast("Vui lòng điền đầy đủ các trường bắt buộc.");
    return;
  }

  if (videoCheckState.status !== 'ok' || videoCheckState.videoId !== yt) {
    showToast("Video chưa được xác nhận có thể phát trên website.");
    scheduleYouTubeVideoCheck();
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
    showToast("Cập nhật phim thành công.");
  } else {
    // Creating new movie
    const newId = getNextId();
    currentMovies.push({ ...movieData, id: newId });
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
  ['title', 'thumb', 'duration'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.dataset.autoFilled = '0';
  });
  markVideoCheckIdle();
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
  URL.revokeObjectURL(url);
  
  showToast("Xuất file movies.js thành công!");
}

