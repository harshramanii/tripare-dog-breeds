import { API_BASE_URL, MAX_RETRIES, REQUEST_TIMEOUT_MS } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Server-side and transport errors we retry on. */
const isRetryable = (err: unknown): boolean => {
  if (err instanceof ApiError) {
    if (err.status == null) return true;
    if (err.status === 408 || err.status === 429) return true;
    if (err.status >= 500 && err.status < 600) return true;
    return false;
  }
  return true;
};

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET a JSON resource with exponential backoff (100ms * 2^n + jitter).
 * Throws ApiError on non-retryable failures or exhausted retries.
 */
export async function getJson<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= MAX_RETRIES) {
    try {
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
      if (!res.ok) {
        throw new ApiError(`HTTP ${res.status} for ${url}`, res.status);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) break;
      const backoff = 100 * 2 ** attempt + Math.floor(Math.random() * 100);
      await sleep(backoff);
      attempt += 1;
    }
  }
  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(`Request failed: ${url}`, undefined, lastError);
}
