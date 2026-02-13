import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
}

export async function getMe() {
  return request("/users/me");
}

export async function getVisits() {
  return request("/visits");
}

export async function getVisit(visitId) {
  return request(`/visits/${visitId}`);
}

export async function createVisit(payload) {
  return request("/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function getEntries(visitId) {
  return request(`/visits/${visitId}/entries`);
}

export async function createTextEntry(visitId, payload) {
  return request(`/visits/${visitId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "text",
      text: payload.text,
      isFinding: payload.isFinding
    })
  });
}

export async function createFileEntry(visitId, payload) {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("file", payload.file);
  formData.append("isFinding", String(Boolean(payload.isFinding)));

  return request(`/visits/${visitId}/entries`, {
    method: "POST",
    body: formData
  });
}

export async function updateEntry(entryId, payload) {
  return request(`/entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function transcribeEntry(entryId) {
  return request(`/entries/${entryId}/transcribe`, { method: "POST" });
}

export async function generateReport(visitId) {
  return request(`/visits/${visitId}/generate-report`, { method: "POST" });
}

export async function generateAIReport(visitId) {
  return request(`/visits/${visitId}/generate-ai-report`, { method: "POST" });
}

export async function getLatestReport(visitId) {
  return request(`/visits/${visitId}/report`);
}
