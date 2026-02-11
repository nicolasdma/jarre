/**
 * Jarre - Client-Side API Fetch Wrapper
 *
 * Standardized fetch for React client components.
 * Consistent error handling, typed responses, no more raw `fetch()`.
 */

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Typed fetch wrapper for API calls from client components.
 *
 * Usage:
 *   const data = await apiFetch<ReviewCard[]>('/api/review/due');
 *   const result = await apiFetch<SubmitResponse>('/api/review/submit', {
 *     method: 'POST',
 *     body: { questionId, userAnswer },
 *   });
 */
export async function apiFetch<T>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const init: RequestInit = { method, signal };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    let message: string;
    try {
      const errorBody = await response.json();
      message = errorBody.error || response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new ApiClientError(response.status, message);
  }

  return response.json() as Promise<T>;
}
