const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL ?? "";
  return url.replace(/\/$/, "");
};

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface VerifyEmailResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
}

export interface Matiere {
  id: string;
  nom: string;
  niveau: string;
  description?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  matiere_id?: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail ?? json.message ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail ?? json.message ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<LoginResponse>;
}

export async function registerUser(
  email: string,
  password: string,
  fullName?: string
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<VerifyEmailResponse> {
  return apiFetch<VerifyEmailResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resendCode(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function fetchCurrentUser(token: string): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/auth/me", {}, token);
}

export async function fetchMatieres(token: string): Promise<Matiere[]> {
  return apiFetch<Matiere[]>("/api/matieres", {}, token);
}

export async function sendChatMessage(
  matiereId: string,
  message: string,
  token: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(
    "/api/chat",
    {
      method: "POST",
      body: JSON.stringify({ matiere_id: matiereId, message }),
    },
    token
  );
}

export async function fetchChatHistory(
  matiereId: string,
  token: string
): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(`/api/chat/history/${matiereId}`, {}, token);
}

export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
