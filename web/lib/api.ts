/** API client - 统一 fetch 封装，自动带 Bearer token。 */

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("banyu-auth") ? readTokenFromStorage() : null;
}

function readTokenFromStorage(): string | null {
  const raw = localStorage.getItem("banyu-auth");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { token?: unknown } };
    const token = parsed.state?.token;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

function extractDetail(data: unknown): string | null {
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    return typeof d === "string" ? d : null;
  }
  return null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = extractDetail(data) ?? `请求失败 (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}
