const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'pp_token';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders(requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request(method, path, body = null, requiresAuth = true) {
  const options = {
    method,
    headers: getAuthHeaders(requiresAuth),
  };

  if (body !== null) {
    if (body instanceof FormData) {
      // Remove Content-Type so browser sets it with boundary
      delete options.headers['Content-Type'];
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, options);

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'string' ? data : null) ||
      `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function get(path, requiresAuth = true) {
  return request('GET', path, null, requiresAuth);
}

export async function post(path, body = null, requiresAuth = true) {
  return request('POST', path, body, requiresAuth);
}

export async function put(path, body = null, requiresAuth = true) {
  return request('PUT', path, body, requiresAuth);
}

export async function del(path, requiresAuth = true) {
  return request('DELETE', path, null, requiresAuth);
}

const api = { get, post, put, del, setToken, clearToken, getToken };
export default api;
