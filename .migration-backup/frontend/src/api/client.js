const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "assistant_gi_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:logout"));
  }

  return res;
}

export async function registerUser({ nom, email, mot_de_passe }) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ nom, email, mot_de_passe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Inscription impossible.");
  }
  return res.json();
}

export async function verifyEmailCode({ email, code, nom }) {
  const res = await apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code, nom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Code invalide.");
  }
  return res.json();
}

export async function resendConfirmationCode(email) {
  const res = await apiFetch("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Envoi impossible.");
  }
  return res.json();
}

export async function loginUser({ email, mot_de_passe }) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Connexion impossible.");
  }
  return res.json();
}

export async function fetchMe() {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Session expirée.");
  return res.json();
}

export async function fetchMatieres(niveau = null) {
  const path = niveau ? `/api/matieres?niveau=${niveau}` : "/api/matieres";
  const res = await apiFetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Impossible de charger les matières.");
  }
  return res.json();
}

export async function sendChatMessage(matiereId, message, file = null) {
  let body;
  let headers = {};

  if (file) {
    body = new FormData();
    body.append("matiere_id", matiereId);
    body.append("message", message);
    body.append("file", file);
  } else {
    body = new FormData();
    body.append("matiere_id", matiereId);
    body.append("message", message);
  }

  const res = await apiFetch("/api/chat", {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur lors de l'envoi du message.");
  }
  return res.json();
}

export async function fetchChatHistory(matiereId) {
  const res = await apiFetch(`/api/chat/history/${matiereId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Impossible de charger l'historique.");
  }
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}
