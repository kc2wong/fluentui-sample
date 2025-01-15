import { Error as Err, systemError } from '../models/system';
import { traceManager } from './trace-manager';

const toError = async (response: Response): Promise<Err> => {
  const text = await response.text();
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const json = JSON.parse(text);
    const errorCode = json.code;
    const errorParameters = json.parameters;
    return { code: errorCode, parameters: errorParameters as string[] };
  } else {
    return systemError(text);
  }
};

export const get = async <T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T | Err> => {
  const tracing = traceManager.newSpan();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        ...headers, // Additional headers
        'x-trace-id': tracing.traceId,
        'x-span-id': tracing.spanId,
      },
    });

    if (!response.ok) {
      return await toError(response);
    } else {
      const data: unknown = await response.json();
      return data as T;
    }
  } finally {
    traceManager.endSpan();
  }
};

const postOrPut = async <T, B = unknown>(
  url: string,
  action: 'POST' | 'PUT',
  body: B,
  headers: Record<string, string> = {},
): Promise<T | Err> => {
  const tracing = traceManager.newSpan();
  try {
    const response = await fetch(url, {
      method: action,
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        ...headers, // Additional headers
        'x-trace-id': tracing.traceId,
        'x-span-id': tracing.spanId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return await toError(response);
    } else {
      const data: unknown = await response.json();
      return data as T;
    }
  } finally {
    traceManager.endSpan();
  }
};

export const post = async <T, B = unknown>(
  url: string,
  body: B,
  headers: Record<string, string> = {},
): Promise<T | Err> => {
  return postOrPut(url, 'POST', body, headers);
};

export const put = async <T, B = unknown>(
  url: string,
  body: B,
  headers: Record<string, string> = {},
): Promise<T | Err> => {
  return postOrPut(url, 'PUT', body, headers);
};
