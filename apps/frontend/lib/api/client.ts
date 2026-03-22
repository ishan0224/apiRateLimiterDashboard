export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(`Request failed with ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
