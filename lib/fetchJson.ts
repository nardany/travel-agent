type FetchErrorType = "NETWORK_ERROR" | "HTTP_ERROR" | "PARSE_ERROR";

export type FetchError = {
  type: FetchErrorType;
  status: number | null;
  message: string;
  retryable: boolean;
};

export type Result<T> = {
  data: T | null;
  error: FetchError | null;
};

export async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<Result<T>> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      return {
        data: null,
        error: {
          type: "HTTP_ERROR",
          status: res.status,
          message:
            res.status === 404
              ? "Resource not found"
              : res.status === 429
              ? "Too many requests"
              : `HTTP error ${res.status}`,
          retryable: res.status >= 500 || res.status === 429,
        },
      };
    }

    let data: T;
    try {
      data = await res.json();
    } catch {
      return {
        data: null,
        error: {
          type: "PARSE_ERROR",
          status: res.status,
          message: "Parse error: Response is not valid JSON",
          retryable: false,
        },
      };
    }
    return {
      data: data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        type: "NETWORK_ERROR",
        status: null,
        message: error instanceof Error ? error.message : "Network request failed",
        retryable: true,
      },
    };
  }
}