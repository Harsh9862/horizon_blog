const API_BASE_URL = 'http://localhost:8081/api';
const TOKEN_KEY = 'horizon.auth.token';
const REFRESH_TOKEN_KEY = 'horizon.auth.refreshToken';
const USER_KEY = 'horizon.auth.user';
let refreshInFlight = null;

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function isAuthenticated() {
  return Boolean(getAuthToken() && getCurrentUser());
}

function setSession(authResponse) {
  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken || '');
  localStorage.setItem(USER_KEY, JSON.stringify({
    userId: authResponse.userId,
    username: authResponse.username,
    displayName: authResponse.displayName,
    email: authResponse.email,
    role: authResponse.role
  }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getCurrentPageReference() {
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  return `${currentPage}${window.location.search}`;
}

function redirectToLogin(target = getCurrentPageReference()) {
  const redirect = encodeURIComponent(target || 'home.html');
  window.location.href = `login.html?redirect=${redirect}`;
}

function resolvePostAuthRedirect(defaultPage = 'home.html') {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  if (!redirect) {
    return defaultPage;
  }
  if (/^https?:/i.test(redirect) || redirect.startsWith('//') || redirect.includes('login.html') || redirect.includes('register.html')) {
    return defaultPage;
  }
  return redirect;
}

function requireAuth(target = getCurrentPageReference()) {
  if (!isAuthenticated()) {
    redirectToLogin(target);
    return null;
  }
  return getCurrentUser();
}

async function logoutUser(redirectTarget = 'login.html') {
  try {
    if (getAuthToken()) {
      await apiFetch('/auth/logout', { method: 'POST' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    clearSession();
    window.location.href = redirectTarget;
  }
}

async function apiFetch(path, options = {}) {
  return apiFetchInternal(path, options, true);
}

async function apiFetchInternal(path, options = {}, allowRefresh = true) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null
      ? payload.message || response.statusText
      : response.statusText;

    const looksLikeAuthFailure = /unauthoriz|forbidden|authentication|access denied|credentials|expired/i.test(String(message));
    if (allowRefresh && response.status === 401 && looksLikeAuthFailure && getRefreshToken() && !path.startsWith('/auth/refresh')) {
      try {
        await refreshSession();
        return apiFetchInternal(path, options, false);
      } catch (refreshError) {
        clearSession();
      }
    }
    const currentPage = window.location.pathname.split('/').pop();
    if ((response.status === 401 || response.status === 403) && looksLikeAuthFailure && currentPage !== 'login.html' && currentPage !== 'register.html') {
      clearSession();
      redirectToLogin();
    }

    throw new Error(message);
  }

  return payload;
}

async function refreshSession() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  })
    .then(async response => {
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null
          ? payload.message || response.statusText
          : response.statusText;
        throw new Error(message);
      }

      setSession(payload);
      return payload;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function deriveUsername(displayName, email) {
  const base = slugify(displayName).replace(/-/g, '') || email.split('@')[0] || 'user';
  return `${base}${Math.floor(Math.random() * 1000)}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function initialsFromName(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'HB';
}
