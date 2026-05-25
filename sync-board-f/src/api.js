export const API = "http://localhost:5000";

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function getFeedProjects() {
  return fetch(`${API}/api/projects/feed`, { headers: headers() }).then(handleResponse);
}

export function createProject(token, body) {
  return fetch(`${API}/api/projects/create`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  }).then(handleResponse);
}

export function toggleLike(token, projectId) {
  return fetch(`${API}/api/projects/like/${projectId}`, {
    method: "PUT",
    headers: headers(token),
  }).then(handleResponse);
}

export function addComment(token, projectId, text) {
  return fetch(`${API}/api/projects/comment/${projectId}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ text }),
  }).then(handleResponse);
}

export function sendJoinRequest(token, projectId, note) {
  return fetch(`${API}/api/projects/request/${projectId}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ note }),
  }).then(handleResponse);
}
