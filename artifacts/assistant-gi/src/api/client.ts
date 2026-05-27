const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "assistant_gi_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
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

export async function registerUser({ nom, email, mot_de_passe }: { nom: string; email: string; mot_de_passe: string }) {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ nom, email, mot_de_passe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Inscription impossible.");
  }
  return res.json();
}

export async function verifyEmailCode({ email, code, nom }: { email: string; code: string; nom: string }) {
  const res = await apiFetch("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code, nom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Code invalide.");
  }
  return res.json();
}

export async function resendConfirmationCode(email: string) {
  const res = await apiFetch("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Envoi impossible.");
  }
  return res.json();
}

export async function loginUser({ email, mot_de_passe }: { email: string; mot_de_passe: string }) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Connexion impossible.");
  }
  return res.json();
}

export async function fetchMe() {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Session expirée.");
  return res.json();
}

export async function fetchMatieres(niveau: string | null = null) {
  const path = niveau ? `/api/matieres?niveau=${niveau}` : "/api/matieres";
  const res = await apiFetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Impossible de charger les matières.");
  }
  return res.json();
}

export async function sendChatMessage(matiereId: number | string, message: string, file: File | null = null) {
  const body = new FormData();
  body.append("matiere_id", String(matiereId));
  body.append("message", message);
  if (file) {
    body.append("file", file);
  }

  const res = await apiFetch("/api/chat", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Erreur lors de l'envoi du message.");
  }
  return res.json();
}

export async function fetchChatHistory(matiereId: number | string) {
  const res = await apiFetch(`/api/chat/history/${matiereId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Impossible de charger l'historique.");
  }
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}
