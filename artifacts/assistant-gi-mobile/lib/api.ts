const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL ?? "";
  return url.replace(/\/$/, "");
};

export interface LoginResponse {
  access_token: string;
  token_type: string;
  [key: string]: unknown;
}

export interface RegisterResponse {
  message?: string;
  email?: string;
  [key: string]: unknown;
}

export interface VerifyEmailResponse {
  access_token?: string;
  token_type?: string;
  [key: string]: unknown;
}

export interface UserInfo {
  id?: string | number;
  email?: string;
  nom?: string;
  [key: string]: unknown;
}

export interface Matiere {
  id: number | string;
  nom_matiere: string;
  niveau: string;
  [key: string]: unknown;
}

export interface ChatHistoryItem {
  role: string;
  contenu: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isRejected?: boolean;
  isError?: boolean;
}

export interface ChatResponse {
  reply: string;
  autorise?: boolean;
  [key: string]: unknown;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = (json as { detail?: string; message?: string }).detail ??
        (json as { detail?: string; message?: string }).message ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function loginUser(email: string, mot_de_passe: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, mot_de_passe }),
  });
}

export async function registerUser(
  nom: string,
  email: string,
  mot_de_passe: string
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ nom, email, mot_de_passe }),
  });
}

export async function verifyEmailCode(
  email: string,
  code: string,
  nom: string
): Promise<VerifyEmailResponse> {
  return apiFetch<VerifyEmailResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code, nom }),
  });
}

export async function resendCode(email: string): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function fetchCurrentUser(token: string): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/auth/me", {}, token);
}

export async function fetchMatieres(token: string, niveau?: string): Promise<Matiere[]> {
  const path = niveau ? `/api/matieres?niveau=${niveau}` : "/api/matieres";
  const data = await apiFetch<{ matieres?: Matiere[] }>(path, {}, token);
  return data.matieres ?? [];
}

export async function sendChatMessage(
  matiereId: number | string,
  message: string,
  token: string
): Promise<ChatResponse> {
  const body = new FormData();
  body.append("matiere_id", String(matiereId));
  body.append("message", message);
  return apiFetch<ChatResponse>("/api/chat", { method: "POST", body }, token);
}

export async function fetchChatHistory(
  matiereId: number | string,
  token: string
): Promise<ChatMessage[]> {
  const data = await apiFetch<{ messages?: ChatHistoryItem[] }>(
    `/api/chat/history/${matiereId}`,
    {},
    token
  );
  const items = data.messages ?? [];
  return items.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.contenu,
    isRejected:
      m.role === "assistant" &&
      m.contenu ===
        "Désolé, je suis un assistant dédié exclusivement au cursus de Génie Informatique. Je ne suis pas autorisé à répondre à cette demande.",
  }));
}

export async function checkHealth(): Promise<boolean> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
