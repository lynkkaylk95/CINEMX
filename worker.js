function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMovieSlug(movie) {
  return movie && (movie.slug || slugify(movie.title) || `pelicula-${movie.id || ""}`);
}

const OLD_HOST = "cinemx.moviemx.workers.dev";
const SITE_ORIGIN = "https://cinemaxmx.com";

function redirectOldDomain(url) {
  if (url.hostname !== OLD_HOST) return null;
  const target = new URL(`${url.pathname}${url.search}`, SITE_ORIGIN);
  return Response.redirect(target.toString(), 301);
}

function getYouTubeId(value) {
  const raw = String(value || "").trim();
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
  const directId = raw.split(/[?&#]/)[0].trim().match(/^([A-Za-z0-9_-]{6,})$/);
  return directId ? directId[1] : "";
}

function getThumbnailUrl(movie) {
  const thumb = String((movie && movie.thumb) || "").trim();
  const videoId = getYouTubeId(thumb) || getYouTubeId(movie && movie.yt);
  if (thumb && !/(?:youtube\.com|youtu\.be|ytimg\.com|^[A-Za-z0-9_-]{6,})/.test(thumb)) {
    return thumb;
  }
  return videoId ? `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg` : thumb;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value, max = 160) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3).trim()}...` : text;
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json;charset=UTF-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64UrlEncode(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function timingSafeEqual(left, right) {
  const a = new TextEncoder().encode(String(left || ""));
  const b = new TextEncoder().encode(String(right || ""));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function createAdminSession(username, secret, isRoot = false) {
  const payload = base64UrlEncode(JSON.stringify({ username, isRoot, exp: Date.now() + 12 * 60 * 60 * 1000 }));
  return `${payload}.${await hmac(payload, secret)}`;
}

async function getAdminSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const token = parseCookies(request).cmx_admin_session || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !timingSafeEqual(signature, await hmac(payload, env.SESSION_SECRET))) return null;
  try {
    const data = JSON.parse(base64UrlDecode(payload));
    return data.exp > Date.now() && data.username ? data : null;
  } catch (_) {
    return null;
  }
}

function adminCookie(token, maxAge = 43200) {
  return `cmx_admin_session=${token}; Max-Age=${maxAge}; Path=/; SameSite=Strict; Secure; HttpOnly`;
}

function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function normalizeMovieInput(input) {
  const title = String(input?.title || "").trim();
  const genres = [...new Set((Array.isArray(input?.genres) ? input.genres : [input?.genre])
    .map((genre) => String(genre || "").trim()).filter(Boolean))];
  const yt = getYouTubeId(input?.yt);
  const movie = {
    title,
    slug: slugify(input?.slug || title),
    genre: genres[0] || "",
    genres,
    type: input?.type === "Serie" ? "Serie" : "Película",
    year: Number(input?.year),
    rating: Number(input?.rating),
    duration: String(input?.duration || "").trim(),
    emoji: String(input?.emoji || "🎬"),
    yt,
    thumb: String(input?.thumb || "").trim(),
    desc: String(input?.desc || "").trim(),
    badge: String(input?.badge || "").trim(),
    episodes: (Array.isArray(input?.episodes) ? input.episodes : []).map((episode) => String(episode).trim()).filter(Boolean)
  };
  if (!movie.title || !isValidSlug(movie.slug) || !movie.genre || !movie.duration || !movie.yt || !movie.desc) return null;
  if (!Number.isInteger(movie.year) || movie.year < 1900 || movie.year > 2200) return null;
  if (!Number.isFinite(movie.rating) || movie.rating < 0 || movie.rating > 10) return null;
  return movie;
}

function movieFromRow(row) {
  let genres = [];
  let episodes = [];
  try { genres = JSON.parse(row.genres_json || "[]"); } catch (_) {}
  try { episodes = JSON.parse(row.episodes_json || "[]"); } catch (_) {}
  return {
    id: Number(row.id), title: row.title, slug: row.slug, genre: row.genre,
    genres, type: row.type, year: Number(row.year), rating: Number(row.rating),
    duration: row.duration, emoji: row.emoji, yt: row.yt, thumb: row.thumb,
    desc: row.description, badge: row.badge || "", episodes,
    addedAt: row.added_at, updatedAt: row.updated_at
  };
}

async function loadMoviesFromD1(env) {
  if (!env.DB) return null;
  try {
    const result = await env.DB.prepare("SELECT * FROM movies ORDER BY datetime(added_at) DESC, id DESC").all();
    return result.results.map(movieFromRow);
  } catch (error) {
    console.error("D1 movies query failed", error);
    return null;
  }
}

async function readJson(request) {
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return null;
  try { return await request.json(); } catch (_) { return null; }
}

function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  return Object.fromEntries(cookieHeader.split(";").map((part) => {
    const [name, ...rest] = part.trim().split("=");
    return [name, rest.join("=")];
  }).filter(([name]) => name));
}

function isValidSlug(value) {
  return /^[a-z0-9][a-z0-9-]{0,120}$/.test(String(value || ""));
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "";
}

function createVisitorId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getWeeklyPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localDate = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  const day = localDate.getUTCDay() || 7;
  localDate.setUTCDate(localDate.getUTCDate() + 4 - day);
  const weekYear = localDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((localDate - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export class MovieViewCounter {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS movie_views (
        slug TEXT PRIMARY KEY,
        total_views INTEGER NOT NULL DEFAULT 0,
        week_key TEXT NOT NULL,
        weekly_views INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS visitor_locks (
        slug TEXT NOT NULL,
        visitor_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (slug, visitor_hash)
      );
    `);
  }

  getViews(slug, weekKey) {
    const row = this.sql.exec(
      "SELECT total_views, week_key, weekly_views FROM movie_views WHERE slug = ?",
      slug
    ).toArray()[0];

    return {
      views: Number(row?.total_views || 0),
      weeklyViews: row?.week_key === weekKey ? Number(row.weekly_views || 0) : 0
    };
  }

  increment(slug, weekKey, visitorHash) {
    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;

    return this.state.storage.transactionSync(() => {
      this.sql.exec("DELETE FROM visitor_locks WHERE slug = ? AND expires_at <= ?", slug, now);
      const lock = this.sql.exec(
        "SELECT 1 AS locked FROM visitor_locks WHERE slug = ? AND visitor_hash = ?",
        slug,
        visitorHash
      ).toArray()[0];

      if (lock) {
        return { ...this.getViews(slug, weekKey), counted: false };
      }

      this.sql.exec(
        `INSERT INTO visitor_locks (slug, visitor_hash, expires_at) VALUES (?, ?, ?)
         ON CONFLICT (slug, visitor_hash) DO UPDATE SET expires_at = excluded.expires_at`,
        slug,
        visitorHash,
        expiresAt
      );

      const row = this.sql.exec(
        `INSERT INTO movie_views (slug, total_views, week_key, weekly_views)
         VALUES (?, 1, ?, 1)
         ON CONFLICT (slug) DO UPDATE SET
           total_views = movie_views.total_views + 1,
           week_key = excluded.week_key,
           weekly_views = CASE
             WHEN movie_views.week_key = excluded.week_key THEN movie_views.weekly_views + 1
             ELSE 1
           END
         RETURNING total_views, weekly_views`,
        slug,
        weekKey
      ).one();

      return {
        views: Number(row.total_views),
        weeklyViews: Number(row.weekly_views),
        counted: true
      };
    });
  }

  getBatch(slugs, weekKey) {
    const views = Object.fromEntries(slugs.map((slug) => [slug, 0]));
    const weeklyViews = Object.fromEntries(slugs.map((slug) => [slug, 0]));
    if (!slugs.length) return { views, weeklyViews };

    const placeholders = slugs.map(() => "?").join(",");
    const rows = this.sql.exec(
      `SELECT slug, total_views, week_key, weekly_views
       FROM movie_views WHERE slug IN (${placeholders})`,
      ...slugs
    ).toArray();

    for (const row of rows) {
      views[row.slug] = Number(row.total_views || 0);
      weeklyViews[row.slug] = row.week_key === weekKey ? Number(row.weekly_views || 0) : 0;
    }

    return { views, weeklyViews };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const weekKey = request.headers.get("X-Week-Key") || getWeeklyPeriod();

    if (url.pathname === "/batch" && request.method === "GET") {
      const slugs = (url.searchParams.get("slugs") || "").split(",").filter(isValidSlug).slice(0, 80);
      return jsonResponse({ ok: true, ...this.getBatch(slugs, weekKey) });
    }

    const match = url.pathname.match(/^\/view\/([^/]+)$/);
    const slug = match ? decodeURIComponent(match[1]) : "";
    if (!isValidSlug(slug) || (request.method !== "GET" && request.method !== "POST")) {
      return jsonResponse({ ok: false, error: "invalid_request" }, { status: 400 });
    }

    if (request.method === "POST") {
      const visitorHash = request.headers.get("X-Visitor-Hash") || "";
      if (!visitorHash) return jsonResponse({ ok: false, error: "missing_visitor" }, { status: 400 });
      return jsonResponse({ ok: true, configured: true, ...this.increment(slug, weekKey, visitorHash) });
    }

    return jsonResponse({
      ok: true,
      configured: true,
      ...this.getViews(slug, weekKey),
      counted: false
    });
  }
}

function getViewCounterStub(env) {
  if (!env.CINEMAX_VIEW_COUNTER) return null;
  const id = env.CINEMAX_VIEW_COUNTER.idFromName("movie-views");
  return env.CINEMAX_VIEW_COUNTER.get(id);
}

async function handleMovieViews(request, env, slug) {
  if (!isValidSlug(slug)) {
    return jsonResponse({ ok: false, error: "invalid_movie", views: 0 }, { status: 400 });
  }

  const counter = getViewCounterStub(env);
  if (!counter) {
    return jsonResponse({ ok: true, configured: false, views: 0, weeklyViews: 0, counted: false });
  }

  const cookies = parseCookies(request);
  const visitorId = cookies.cmx_vid || createVisitorId();
  const userAgent = request.headers.get("User-Agent") || "";
  const visitorHash = await sha256(`${slug}|${visitorId}|${getClientIp(request)}|${userAgent}`);
  const headers = new Headers({
    "Set-Cookie": `cmx_vid=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; SameSite=Lax; Secure; HttpOnly`
  });

  const durableRequest = new Request(`https://view-counter/view/${encodeURIComponent(slug)}`, {
    method: request.method,
    headers: {
      "X-Visitor-Hash": visitorHash,
      "X-Week-Key": getWeeklyPeriod()
    }
  });
  const response = await counter.fetch(durableRequest);
  const data = await response.json();
  return jsonResponse(data, { status: response.status, headers });
}

async function handleMovieViewsBatch(request, env) {
  const counter = getViewCounterStub(env);
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug, index, list) => isValidSlug(slug) && list.indexOf(slug) === index)
    .slice(0, 80);

  if (!counter || !slugs.length) {
    return jsonResponse({
      ok: true,
      configured: Boolean(counter),
      views: Object.fromEntries(slugs.map((slug) => [slug, 0])),
      weeklyViews: Object.fromEntries(slugs.map((slug) => [slug, 0]))
    });
  }

  const durableRequest = new Request(`https://view-counter/batch?slugs=${encodeURIComponent(slugs.join(","))}`, {
    headers: { "X-Week-Key": getWeeklyPeriod() }
  });
  const response = await counter.fetch(durableRequest);
  const data = await response.json();
  return jsonResponse({ ...data, configured: true }, {
    status: response.status,
    headers: {
      "cache-control": "public, max-age=60"
    }
  });
}

async function handleAdminLogin(request, env) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    return jsonResponse({ ok: false, error: "admin_not_configured" }, { status: 503 });
  }
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });

  const ipHash = await sha256(`${getClientIp(request)}|${env.SESSION_SECRET}`);
  if (env.DB) {
    await env.DB.prepare("DELETE FROM admin_login_attempts WHERE attempted_at <= datetime('now', '-1 day')").run();
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS attempts FROM admin_login_attempts WHERE ip_hash = ? AND attempted_at > datetime('now', '-15 minutes')"
    ).bind(ipHash).first();
    if (Number(recent?.attempts || 0) >= 10) {
      return jsonResponse({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }
  }

  const body = await readJson(request);
  const username = String(body?.username || "").trim();
  const passwordHash = await sha256(String(body?.password || ""));
  const isRoot = timingSafeEqual(username.toLowerCase(), String(env.ADMIN_USERNAME).toLowerCase());
  const storedCredential = isRoot && env.DB
    ? await env.DB.prepare("SELECT password_hash FROM admin_credentials WHERE username = ?").bind(env.ADMIN_USERNAME).first()
    : null;
  const managedUser = !isRoot && env.DB
    ? await env.DB.prepare("SELECT email, password_hash FROM admin_users WHERE email = ? COLLATE NOCASE").bind(username).first()
    : null;
  const expectedPasswordHash = isRoot
    ? (storedCredential?.password_hash || env.ADMIN_PASSWORD_HASH)
    : managedUser?.password_hash;
  const valid = Boolean(expectedPasswordHash)
    && timingSafeEqual(passwordHash.toLowerCase(), String(expectedPasswordHash).toLowerCase());

  if (!valid) {
    if (env.DB) {
      await env.DB.prepare("INSERT INTO admin_login_attempts (ip_hash) VALUES (?)").bind(ipHash).run();
    }
    return jsonResponse({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  if (env.DB) await env.DB.prepare("DELETE FROM admin_login_attempts WHERE ip_hash = ?").bind(ipHash).run();
  const sessionUsername = isRoot ? env.ADMIN_USERNAME : managedUser.email;
  const token = await createAdminSession(sessionUsername, env.SESSION_SECRET, isRoot);
  return jsonResponse({ ok: true, username: sessionUsername, isRoot }, { headers: { "Set-Cookie": adminCookie(token) } });
}

async function handleForgotPassword(request, env) {
  if (!env.DB || !env.SEND_EMAIL || !env.ADMIN_RECOVERY_EMAIL || !env.SESSION_SECRET) {
    return jsonResponse({ ok: false, error: "password_recovery_not_configured" }, { status: 503 });
  }
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
  const body = await readJson(request);
  const username = String(body?.username || "").trim();
  const genericResponse = jsonResponse({ ok: true });
  if (!timingSafeEqual(username.toLowerCase(), String(env.ADMIN_USERNAME || "").toLowerCase())) return genericResponse;

  const resetIpHash = await sha256(`password-reset|${getClientIp(request)}|${env.SESSION_SECRET}`);
  const recentRequests = await env.DB.prepare(
    "SELECT COUNT(*) AS attempts FROM admin_login_attempts WHERE ip_hash = ? AND attempted_at > datetime('now', '-1 hour')"
  ).bind(resetIpHash).first();
  if (Number(recentRequests?.attempts || 0) >= 5) return genericResponse;
  await env.DB.prepare("INSERT INTO admin_login_attempts (ip_hash) VALUES (?)").bind(resetIpHash).run();

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64UrlEncode(tokenBytes);
  const tokenHash = await sha256(token);
  await env.DB.prepare("DELETE FROM admin_password_resets WHERE expires_at <= datetime('now') OR username = ?")
    .bind(env.ADMIN_USERNAME).run();
  await env.DB.prepare(
    "INSERT INTO admin_password_resets (token_hash, username, expires_at) VALUES (?, ?, datetime('now', '+30 minutes'))"
  ).bind(tokenHash, env.ADMIN_USERNAME).run();

  const resetUrl = `${new URL(request.url).origin}/admin?reset=${encodeURIComponent(token)}`;
  const from = env.ADMIN_EMAIL_FROM || "admin@cinemaxmx.com";
  const textBody = [
    "Ban da yeu cau dat lai mat khau quan tri CineMax MX.",
    `Mo lien ket sau trong vong 30 phut: ${resetUrl}`,
    "Neu ban khong yeu cau, hay bo qua email nay."
  ].join("\n");
  try {
    await env.SEND_EMAIL.send({
      to: env.ADMIN_RECOVERY_EMAIL,
      from: { email: from, name: "CineMax MX" },
      subject: "Dat lai mat khau quan tri CineMax MX",
      text: textBody
    });
  } catch (error) {
    console.error("Password recovery email failed", error?.code, error?.message || error);
    return jsonResponse({ ok: false, error: "email_delivery_failed", reason: error?.code || "unknown" }, { status: 502 });
  }
  return genericResponse;
}

async function handleResetPassword(request, env) {
  if (!env.DB || !env.SESSION_SECRET) return jsonResponse({ ok: false, error: "password_recovery_not_configured" }, { status: 503 });
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
  const body = await readJson(request);
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  if (token.length < 30 || password.length < 10) {
    return jsonResponse({ ok: false, error: "invalid_reset_request" }, { status: 400 });
  }
  const tokenHash = await sha256(token);
  const reset = await env.DB.prepare(
    "SELECT username FROM admin_password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
  if (!reset) return jsonResponse({ ok: false, error: "invalid_or_expired_token" }, { status: 400 });

  const newPasswordHash = await sha256(password);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO admin_credentials (username, password_hash, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`)
      .bind(reset.username, newPasswordHash),
    env.DB.prepare("UPDATE admin_password_resets SET used_at = datetime('now') WHERE token_hash = ?").bind(tokenHash)
  ]);
  return jsonResponse({ ok: true });
}

async function requireAdmin(request, env) {
  const session = await getAdminSession(request, env);
  if (!session) return null;
  if (timingSafeEqual(String(session.username).toLowerCase(), String(env.ADMIN_USERNAME || "").toLowerCase())) return session;
  if (!env.DB) return null;
  const user = await env.DB.prepare("SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE").bind(session.username).first();
  return user ? session : null;
}

function isRootAdmin(session, env) {
  return Boolean(session) && (session.isRoot === true
    || timingSafeEqual(String(session.username).toLowerCase(), String(env.ADMIN_USERNAME || "").toLowerCase()));
}

function adminUserFromRow(row) {
  return { id: Number(row.id), name: row.name, email: row.email, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function handleAdminUsers(request, env, id = null) {
  if (!env.DB) return jsonResponse({ ok: false, error: "database_not_configured" }, { status: 503 });
  const session = await requireAdmin(request, env);
  if (!session) return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isRootAdmin(session, env)) return jsonResponse({ ok: false, error: "root_admin_required" }, { status: 403 });
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  const validRoute = (!id && (request.method === "GET" || request.method === "POST"))
    || (Boolean(id) && (request.method === "PUT" || request.method === "DELETE"));
  if (!validRoute) return jsonResponse({ ok: false, error: "method_not_allowed" }, { status: 405 });

  if (request.method === "GET") {
    const result = await env.DB.prepare("SELECT id, name, email, created_at, updated_at FROM admin_users ORDER BY datetime(created_at) DESC, id DESC").all();
    return jsonResponse({ ok: true, users: result.results.map(adminUserFromRow) });
  }
  if (request.method === "DELETE" && id) {
    const result = await env.DB.prepare("DELETE FROM admin_users WHERE id = ?").bind(Number(id)).run();
    if (!Number(result.meta?.changes || 0)) return jsonResponse({ ok: false, error: "not_found" }, { status: 404 });
    return jsonResponse({ ok: true });
  }

  const body = await readJson(request);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (request.method === "POST" && password.length < 10) || (password && password.length < 10)) {
    return jsonResponse({ ok: false, error: "invalid_user" }, { status: 400 });
  }
  if (timingSafeEqual(email, String(env.ADMIN_USERNAME || "").toLowerCase())) {
    return jsonResponse({ ok: false, error: "root_account_reserved" }, { status: 409 });
  }

  try {
    if (request.method === "POST") {
      const result = await env.DB.prepare("INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)")
        .bind(name, email, await sha256(password)).run();
      const created = await env.DB.prepare("SELECT id, name, email, created_at, updated_at FROM admin_users WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return jsonResponse({ ok: true, user: adminUserFromRow(created) }, { status: 201 });
    }
    if (request.method === "PUT" && id) {
      const existing = await env.DB.prepare("SELECT id FROM admin_users WHERE id = ?").bind(Number(id)).first();
      if (!existing) return jsonResponse({ ok: false, error: "not_found" }, { status: 404 });
      if (password) {
        await env.DB.prepare("UPDATE admin_users SET name = ?, email = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(name, email, await sha256(password), Number(id)).run();
      } else {
        await env.DB.prepare("UPDATE admin_users SET name = ?, email = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(name, email, Number(id)).run();
      }
      const updated = await env.DB.prepare("SELECT id, name, email, created_at, updated_at FROM admin_users WHERE id = ?").bind(Number(id)).first();
      return jsonResponse({ ok: true, user: adminUserFromRow(updated) });
    }
  } catch (error) {
    if (String(error?.message || error).includes("UNIQUE")) return jsonResponse({ ok: false, error: "duplicate_email" }, { status: 409 });
    console.error("Admin user mutation failed", error);
    return jsonResponse({ ok: false, error: "database_error" }, { status: 500 });
  }
  return jsonResponse({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

async function handleAdminMovies(request, env, id = null) {
  if (!env.DB) return jsonResponse({ ok: false, error: "database_not_configured" }, { status: 503 });
  if (!await requireAdmin(request, env)) return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  if (request.method === "GET") {
    return jsonResponse({ ok: true, movies: await loadMoviesFromD1(env) || [] });
  }

  if (request.method === "DELETE") {
    const result = await env.DB.prepare("DELETE FROM movies WHERE id = ?").bind(Number(id)).run();
    return jsonResponse({ ok: true, deleted: Number(result.meta?.changes || 0) > 0 });
  }

  const body = await readJson(request);
  const movie = normalizeMovieInput(body);
  if (!movie) return jsonResponse({ ok: false, error: "invalid_movie" }, { status: 400 });

  try {
    if (request.method === "POST") {
      const result = await env.DB.prepare(`
        INSERT INTO movies (title, slug, genre, genres_json, type, year, rating, duration, emoji, yt, thumb, description, badge, episodes_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(movie.title, movie.slug, movie.genre, JSON.stringify(movie.genres), movie.type, movie.year,
        movie.rating, movie.duration, movie.emoji, movie.yt, movie.thumb, movie.desc, movie.badge,
        JSON.stringify(movie.episodes)).run();
      const created = await env.DB.prepare("SELECT * FROM movies WHERE id = ?").bind(result.meta.last_row_id).first();
      return jsonResponse({ ok: true, movie: movieFromRow(created) }, { status: 201 });
    }

    if (request.method === "PUT" && id) {
      const result = await env.DB.prepare(`
        UPDATE movies SET title = ?, slug = ?, genre = ?, genres_json = ?, type = ?, year = ?, rating = ?,
          duration = ?, emoji = ?, yt = ?, thumb = ?, description = ?, badge = ?, episodes_json = ?,
          updated_at = datetime('now') WHERE id = ?
      `).bind(movie.title, movie.slug, movie.genre, JSON.stringify(movie.genres), movie.type, movie.year,
        movie.rating, movie.duration, movie.emoji, movie.yt, movie.thumb, movie.desc, movie.badge,
        JSON.stringify(movie.episodes), Number(id)).run();
      if (!Number(result.meta?.changes || 0)) return jsonResponse({ ok: false, error: "not_found" }, { status: 404 });
      const updated = await env.DB.prepare("SELECT * FROM movies WHERE id = ?").bind(Number(id)).first();
      return jsonResponse({ ok: true, movie: movieFromRow(updated) });
    }
  } catch (error) {
    if (String(error?.message || error).includes("UNIQUE")) {
      return jsonResponse({ ok: false, error: "duplicate_slug_or_video" }, { status: 409 });
    }
    console.error("Admin movie mutation failed", error);
    return jsonResponse({ ok: false, error: "database_error" }, { status: 500 });
  }

  return jsonResponse({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

async function handleLegacyMovieImport(request, env) {
  if (!env.DB) return jsonResponse({ ok: false, error: "database_not_configured" }, { status: 503 });
  if (!await requireAdmin(request, env)) return jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM movies").first();
  if (Number(count?.total || 0) > 0) return jsonResponse({ ok: false, error: "database_not_empty" }, { status: 409 });

  const assetUrl = new URL("/js/movies.js", request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl));
  const source = await response.text();
  const match = source.match(/const\s+MOVIES\s*=\s*(\[[\s\S]*?\]);?\s*$/);
  if (!match) return jsonResponse({ ok: false, error: "legacy_data_unavailable" }, { status: 500 });
  let legacyMovies;
  try { legacyMovies = JSON.parse(match[1]); } catch (_) {
    return jsonResponse({ ok: false, error: "legacy_data_invalid" }, { status: 500 });
  }

  const statements = legacyMovies.map((input) => {
    const movie = normalizeMovieInput(input);
    if (!movie) return null;
    return env.DB.prepare(`
      INSERT INTO movies (id, title, slug, genre, genres_json, type, year, rating, duration, emoji, yt, thumb, description, badge, episodes_json, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(Number(input.id), movie.title, movie.slug, movie.genre, JSON.stringify(movie.genres), movie.type,
      movie.year, movie.rating, movie.duration, movie.emoji, movie.yt, movie.thumb, movie.desc, movie.badge,
      JSON.stringify(movie.episodes), input.addedAt || new Date().toISOString());
  }).filter(Boolean);
  if (!statements.length) return jsonResponse({ ok: false, error: "legacy_data_empty" }, { status: 500 });
  await env.DB.batch(statements);
  return jsonResponse({ ok: true, imported: statements.length });
}

async function loadMovies(request, env) {
  const databaseMovies = await loadMoviesFromD1(env);
  if (databaseMovies !== null) return databaseMovies;
  const moviesUrl = new URL("/js/movies.js", request.url);
  const response = await env.ASSETS.fetch(new Request(moviesUrl, { method: "GET" }));
  if (!response.ok) return [];

  const source = await response.text();
  const match = source.match(/const\s+MOVIES\s*=\s*(\[[\s\S]*?\]);?\s*$/);
  if (!match) return [];

  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return [];
  }
}

function moviesJavascriptResponse(movies) {
  return new Response(`// Generated from CineMax MX online database\nconst MOVIES = ${JSON.stringify(movies)};\n`, {
    headers: {
      "content-type": "application/javascript;charset=UTF-8",
      "cache-control": "no-cache, must-revalidate"
    }
  });
}

function injectMovieMeta(html, movie, request) {
  if (!movie) return html;

  const slug = getMovieSlug(movie);
  const canonicalUrl = `${SITE_ORIGIN}/pelicula/${encodeURIComponent(slug)}`;
  const title = `${movie.title || "Película"} - CineMax MX`;
  const description = truncate(movie.desc || "Mira películas completas y series en español latino en CineMax MX.");
  const image = getThumbnailUrl(movie) || "https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Movie",
        name: movie.title || "Película",
        description,
        image,
        url: canonicalUrl
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Películas", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 3, name: movie.title || "Película", item: canonicalUrl }
        ]
      }
    ]
  };

  return html
    .replace(/<meta name="description" id="meta-desc" content="[^"]*">/, `<meta name="description" id="meta-desc" content="${escapeHtml(description)}">`)
    .replace(/<link rel="canonical" id="canonical-link" href="[^"]*">/, `<link rel="canonical" id="canonical-link" href="${escapeHtml(canonicalUrl)}">`)
    .replace(/<meta property="og:title" id="og-title" content="[^"]*">/, `<meta property="og:title" id="og-title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:description" id="og-desc" content="[^"]*">/, `<meta property="og:description" id="og-desc" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:url" id="og-url" content="[^"]*">/, `<meta property="og:url" id="og-url" content="${escapeHtml(canonicalUrl)}">`)
    .replace(/<meta property="og:image" id="og-image" content="[^"]*">/, `<meta property="og:image" id="og-image" content="${escapeHtml(image)}">`)
    .replace(/<meta name="twitter:title" id="twitter-title" content="[^"]*">/, `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(title)}">`)
    .replace(/<meta name="twitter:description" id="twitter-desc" content="[^"]*">/, `<meta name="twitter:description" id="twitter-desc" content="${escapeHtml(description)}">`)
    .replace(/<meta name="twitter:image" id="twitter-image" content="[^"]*">/, `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(image)}">`)
    .replace(/<title id="page-title">[\s\S]*?<\/title>/, `<title id="page-title">${escapeHtml(title)}</title>`)
    .replace(/<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="structured-data">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`);
}

async function serveMovieShell(request, env, movie, assetPath = "/movie.html") {
  const movieUrl = new URL(assetPath, request.url);
  const response = await env.ASSETS.fetch(new Request(movieUrl, { method: "GET", headers: request.headers }));
  if (!response.ok) return response;

  const html = injectMovieMeta(await response.text(), movie, request);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "no-cache, no-store, must-revalidate"
    }
  });
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemap(request, movies) {
  const years = [...new Set(movies.map((movie) => Number(movie.year)).filter(Boolean))].sort((a, b) => b - a);
  const genres = [...new Set(movies.flatMap((movie) => Array.isArray(movie.genres) ? movie.genres : [movie.genre]).filter(Boolean).map(slugify))];
  const legalPages = ["about.html", "privacy.html", "terms.html", "dmca.html", "contact.html"];
  const urls = [
    { loc: `${SITE_ORIGIN}/`, priority: "1.0" },
    ...legalPages.map((page) => ({ loc: `${SITE_ORIGIN}/${page}`, priority: "0.6" })),
    ...years.map((year) => ({ loc: `${SITE_ORIGIN}/ano/${year}`, priority: "0.8" })),
    ...genres.map((genre) => ({ loc: `${SITE_ORIGIN}/genero/${encodeURIComponent(genre)}`, priority: "0.8" })),
    ...movies.map((movie) => ({ loc: `${SITE_ORIGIN}/pelicula/${encodeURIComponent(getMovieSlug(movie))}`, priority: "0.9" }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((item) => `  <url>\n    <loc>${xmlEscape(item.loc)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml;charset=UTF-8",
      "cache-control": "no-cache, must-revalidate"
    }
  });
}

async function serveIndexShell(request, env) {
  const indexUrl = new URL("/index.html", request.url);
  return env.ASSETS.fetch(new Request(indexUrl, { method: "GET", headers: request.headers }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const oldDomainRedirect = redirectOldDomain(url);
    if (oldDomainRedirect) return oldDomainRedirect;

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      return handleAdminLogin(request, env);
    }

    if (url.pathname === "/api/admin/forgot-password" && request.method === "POST") {
      return handleForgotPassword(request, env);
    }

    if (url.pathname === "/api/admin/reset-password" && request.method === "POST") {
      return handleResetPassword(request, env);
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      if (!isSameOrigin(request)) return jsonResponse({ ok: false, error: "invalid_origin" }, { status: 403 });
      return jsonResponse({ ok: true }, { headers: { "Set-Cookie": adminCookie("", 0) } });
    }

    if (url.pathname === "/api/admin/session" && request.method === "GET") {
      const session = await requireAdmin(request, env);
      return session
        ? jsonResponse({ ok: true, username: session.username, isRoot: isRootAdmin(session, env) })
        : jsonResponse({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (url.pathname === "/api/admin/users") return handleAdminUsers(request, env);
    const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
    if (adminUserMatch) return handleAdminUsers(request, env, Number(adminUserMatch[1]));

    if (url.pathname === "/api/admin/movies") {
      return handleAdminMovies(request, env);
    }

    if (url.pathname === "/api/admin/import-legacy" && request.method === "POST") {
      return handleLegacyMovieImport(request, env);
    }

    const adminMovieMatch = url.pathname.match(/^\/api\/admin\/movies\/(\d+)$/);
    if (adminMovieMatch) {
      return handleAdminMovies(request, env, Number(adminMovieMatch[1]));
    }

    if ((url.pathname === "/admin" || url.pathname === "/admin/") && request.method === "GET") {
      return env.ASSETS.fetch(new Request(new URL("/admin.html", request.url), { headers: request.headers }));
    }

    if (url.pathname === "/js/movies.js" && request.method === "GET") {
      const movies = await loadMoviesFromD1(env);
      if (movies !== null) return moviesJavascriptResponse(movies);
    }

    if ((url.pathname === "/api/views" || url.pathname === "/api/view-counts") && request.method === "GET") {
      return handleMovieViewsBatch(request, env);
    }

    const viewsMatch = url.pathname.match(/^\/api\/views\/([^/]+)$/);
    if (viewsMatch && (request.method === "GET" || request.method === "POST")) {
      return handleMovieViews(request, env, decodeURIComponent(viewsMatch[1]));
    }

    if (url.pathname === "/sitemap.xml") {
      return buildSitemap(request, await loadMovies(request, env));
    }

    if (url.pathname === "/movie" || url.pathname === "/movie.html") {
      const id = url.searchParams.get("id");
      if (id) {
        const movies = await loadMovies(request, env);
        const movie = movies.find((item) => Number(item.id) === Number(id));
        const slug = getMovieSlug(movie);
        if (slug) {
          return Response.redirect(`${SITE_ORIGIN}/pelicula/${encodeURIComponent(slug)}`, 301);
        }
      }
    }

    const moviePathMatch = url.pathname.match(/^\/pelicula\/([^/]+)\/?$/);
    if (moviePathMatch) {
      const slug = decodeURIComponent(moviePathMatch[1]);
      const movies = await loadMovies(request, env);
      const movie = movies.find((item) => getMovieSlug(item) === slug);
      return serveMovieShell(request, env, movie, "/detail.html");
    }

    const watchPathMatch = url.pathname.match(/^\/ver\/([^/]+)\/?$/);
    if (watchPathMatch) {
      const slug = decodeURIComponent(watchPathMatch[1]);
      const movies = await loadMovies(request, env);
      const movie = movies.find((item) => getMovieSlug(item) === slug);
      return serveMovieShell(request, env, movie, "/movie.html");
    }

    if (/^\/ano\/\d{4}\/?$/.test(url.pathname) || /^\/genero\/[^/]+\/?$/.test(url.pathname) || /^\/buscar\/?$/.test(url.pathname) || /^\/tendencias\/?$/.test(url.pathname)) {
      const catalogUrl = new URL("/catalog.html", request.url);
      return env.ASSETS.fetch(new Request(catalogUrl, { method: "GET", headers: request.headers }));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return assetResponse;
  }
};
