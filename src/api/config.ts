export const API_BASE_URL = "https://dogapi.dog/api/v2";

/** Per-request timeout for a single fetch attempt. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Retry cap for transient failures. */
export const MAX_RETRIES = 3;
