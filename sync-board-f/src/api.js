const BASE = import.meta.env.VITE_API_BASE_URL || ''

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ── Auth ──
export function login(body) {
  return fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

export function signup(body) {
  return fetch(`${BASE}/api/v1/auth/signup`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

// ── Feed ──
export function getFeedProjects({ page = 1, limit = 12, sort = 'recent', search = '', tag = '' } = {}) {
  const params = new URLSearchParams({ page, limit, sort })
  if (search) params.set('search', search)
  if (tag) params.set('tag', tag)
  return fetch(`${BASE}/api/v1/projects/feed?${params}`, { headers: headers() }).then(handleResponse)
}

export function createProject(token, body) {
  return fetch(`${BASE}/api/v1/projects/create`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

export function toggleLike(token, projectId) {
  return fetch(`${BASE}/api/v1/projects/like/${projectId}`, {
    method: 'PUT',
    headers: headers(token),
  }).then(handleResponse)
}

export function addComment(token, projectId, text) {
  return fetch(`${BASE}/api/v1/projects/comment/${projectId}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ text }),
  }).then(handleResponse)
}

export function sendJoinRequest(token, projectId, note) {
  return fetch(`${BASE}/api/v1/projects/request/${projectId}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ note }),
  }).then(handleResponse)
}

export function getIncomingRequests(token) {
  return fetch(`${BASE}/api/v1/projects/incoming-requests`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function getMyRequests(token) {
  return fetch(`${BASE}/api/v1/projects/my-requests`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function updateJoinRequest(token, projectId, requestId, status) {
  return fetch(`${BASE}/api/v1/projects/request/${projectId}/${requestId}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ status }),
  }).then(handleResponse)
}

export function getMyTeams(token) {
  return fetch(`${BASE}/api/v1/projects/my-teams`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function removeMember(token, projectId, userId) {
  return fetch(`${BASE}/api/v1/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
    headers: headers(token),
  }).then(handleResponse)
}

// ── Dashboard Projects (CRUD) ──
export function getMyProjects(token) {
  return fetch(`${BASE}/api/v1/projects/project`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function createDashboardProject(token, body) {
  return fetch(`${BASE}/api/v1/projects/add-projects`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

export function editDashboardProject(token, id, body) {
  return fetch(`${BASE}/api/v1/projects/edit-project/${id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

// ── Chat ──
export function getMessages(token, projectId) {
  return fetch(`${BASE}/api/v1/chat/${projectId}`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function sendMessage(token, projectId, text) {
  return fetch(`${BASE}/api/v1/chat/${projectId}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ text }),
  }).then(handleResponse)
}

// ── Canvas ──
export function getCanvasElements(token, projectId) {
  return fetch(`${BASE}/api/v1/canvas/${projectId}`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function createCanvasElement(token, projectId, data) {
  return fetch(`${BASE}/api/v1/canvas/${projectId}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  }).then(handleResponse)
}

export function updateCanvasElement(token, projectId, elementId, data) {
  return fetch(`${BASE}/api/v1/canvas/${projectId}/${elementId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(data),
  }).then(handleResponse)
}

export function deleteCanvasElement(token, projectId, elementId) {
  return fetch(`${BASE}/api/v1/canvas/${projectId}/${elementId}`, {
    method: 'DELETE',
    headers: headers(token),
  }).then(handleResponse)
}

// ── Profile ──
export function getProfile(token) {
  return fetch(`${BASE}/api/v1/profile/`, {
    headers: headers(token),
  }).then(handleResponse)
}

export function updateProfile(token, body) {
  return fetch(`${BASE}/api/v1/profile/edit`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(handleResponse)
}

// ── Namespaced convenience object ──
export const api = {
  auth: { login, signup },
  projects: {
    feed: getFeedProjects,
    create: createProject,
    like: toggleLike,
    comment: addComment,
    request: sendJoinRequest,
    incomingRequests: getIncomingRequests,
    myRequests: getMyRequests,
    updateRequest: updateJoinRequest,
    myTeams: getMyTeams,
    removeMember,
    get: getMyProjects,
    createDashboard: createDashboardProject,
    edit: editDashboardProject,
  },
  chat: { getMessages, sendMessage },
  canvas: {
    getElements: getCanvasElements,
    createElement: createCanvasElement,
    updateElement: updateCanvasElement,
    deleteElement: deleteCanvasElement,
  },
  profile: { get: getProfile, update: updateProfile },
}
