const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const TOKEN_KEY = 'shortly.accessToken'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const message =
      (typeof data?.message === 'string' && data.message) ||
      `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  if (res.status === 204) return null
  return data
}

export const api = {
  health: () => fetch('/health').then((r) => r.json()),

  register: (body) => request('/auth/register', { method: 'POST', body }),

  async login(body) {
    const res = await request('/auth/login', { method: 'POST', body })
    if (res?.data?.accessToken) setAccessToken(res.data.accessToken)
    return res
  },

  async googleLogin(credential) {
    const res = await request('/auth/google', {
      method: 'POST',
      body: { credential },
    })
    if (res?.data?.accessToken) setAccessToken(res.data.accessToken)
    return res
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'GET' })
    } finally {
      setAccessToken(null)
    }
  },

  me: () => request('/auth/user'),

  updateProfile: (body) =>
    request('/auth/user/update', { method: 'PATCH', body }),

  updatePassword: (body) =>
    request('/auth/user/updatepassword', { method: 'PATCH', body }),

  createLink: (linkName, longUrl) =>
    request('/link/create', {
      method: 'POST',
      body: { linkName: linkName || undefined, longUrl },
    }),

  myLinks: () => request('/link/me'),

  deleteLink: (id) => request(`/link/${id}`, { method: 'DELETE' }),

  updateLink: (id, body) => request(`/link/${id}`, { method: 'PATCH', body }),

  getLink: (id) => request(`/link/${id}`),

  analyticsForLink: (linkId) => request(`/analytics/${linkId}`),

  ai: {
    status: () => request('/ai/status'),
    insight: () => request('/ai/insight', { method: 'POST', body: {} }),
    suggestName: (longUrl) =>
      request('/ai/suggest-name', { method: 'POST', body: { longUrl } }),
    linkAnalytics: (linkId) => request(`/ai/analytics/${linkId}`),
    ask: (question, linkId) =>
      request('/ai/ask', {
        method: 'POST',
        body: { question, linkId: linkId || undefined },
      }),
  },
}

export function shortUrlFor(code) {
  // Short links are served by the API host (port 3000 in local dev)
  const apiOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000'
  return `${apiOrigin}/${code}`
}
