import AsyncStorage from "@react-native-async-storage/async-storage";

// Production Render API backend URL
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://assistant-gi-backendd.onrender.com";

const TOKEN_KEY = "assistant_gi_token";

let _authToken: string | null = null;

export function setApiToken(token: string | null) {
  _authToken = token;
}

export async function loadStoredToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    _authToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function persistToken(token: string) {
  _authToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  _authToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export interface User {
  id: string;
  nom: string;
  email: string;
  niveau?: string;
}

export interface Matiere {
  id: number;
  nom: string;
  description?: string;
  niveau?: string;
  icon?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (_authToken) {
    headers.Authorization = `Bearer ${_authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    await removeToken();
  }

  return res;
}

export async function registerUser({
  nom,
  email,
  mot_de_passe,
}: {
  nom: string;
  email: string;
  mot_de_passe: string;
}) {
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

export async function verifyEmailCode({
  email,
  code,
  nom,
}: {
  email: string;
  code: string;
  nom: string;
}) {
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

export async function loginUser({
  email,
  mot_de_passe,
}: {
  email: string;
  mot_de_passe: string;
}): Promise<{ access_token: string; token_type: string }> {
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

export async function fetchMe(): Promise<User> {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Session expirée.");
  return res.json();
}

export async function fetchMatieres(niveau: string | null = null): Promise<Matiere[]> {
  const path = niveau ? `/api/matieres?niveau=${niveau}` : "/api/matieres";
  const res = await apiFetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Impossible de charger les matières.");
  }
  return res.json();
}

export async function sendChatMessage(
  matiereId: number | string,
  message: string
): Promise<{ response: string }> {
  const body = new FormData();
  body.append("matiere_id", String(matiereId));
  body.append("message", message);

  const res = await apiFetch("/api/chat", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Erreur lors de l'envoi.");
  }
  return res.json();
}

export async function fetchChatHistory(matiereId: number | string): Promise<{ messages: Message[] }> {
  const res = await apiFetch(`/api/chat/history/${matiereId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Impossible de charger l'historique.");
  }
  return res.json();
}
