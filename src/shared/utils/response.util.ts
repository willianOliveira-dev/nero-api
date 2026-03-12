export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  method: string;
  timestamp: string;
  data: T;
}

export interface ErrorResponseBody {
  success: false;
  message: string;
  method: string;
  timestamp: string;
  data: null;
  error: {
    code: string;
    details: Record<string, unknown> | null;
  };
}



const STATUS_MESSAGES: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
};


export function formatSuccess<T>(
  method: string,
  data: T,
  statusCode = 200,
): SuccessResponse<T> {
  return {
    success: true,
    message: STATUS_MESSAGES[statusCode] ?? 'OK',
    method,
    timestamp: new Date().toISOString(),
    data,
  };
}

export function formatError(
  method: string,
  message: string,
  _statusCode: number,
  code: string,
  details: Record<string, unknown> | null = null,
): ErrorResponseBody {
  return {
    success: false,
    message,
    method,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      code: `ERR_${code}`,
      details,
    },
  };
}
