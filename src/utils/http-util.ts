/* eslint-disable no-console */
import { context, trace } from '@opentelemetry/api';
import { Error as Err, systemError } from '../models/system';
import * as Sentry from '@sentry/react';
import { v4 as uuidv4 } from 'uuid';
// import { logger } from './logging-util';
// import tracer from './otel-setup';

type Tracing = {
  traceId: string;
  spanId: string;
};

interface TraceGenerator {
  generateTrace: () => Tracing;
}

const createUuidTrace = (): TraceGenerator => ({
  generateTrace: () => {
    return { traceId: uuidv4(), spanId: uuidv4() };
  },
});

const createSentryTrace = (): TraceGenerator => ({
  generateTrace: () => {
    // const traceId = trace.getTracer('my-app');
    // const activeSpan = trace.getSpan(context.active());
    // logger.info(`traceId = ${activeSpan}`);
    const ctx = Sentry.getCurrentScope().getPropagationContext();
    return { traceId: ctx.traceId, spanId: uuidv4()};
  },
});

const isProd = process.env.NODE_ENV === 'production';
const traceIdGenerator: TraceGenerator = isProd ? createUuidTrace() : createSentryTrace();

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
  const tracing = traceIdGenerator.generateTrace();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
      ...headers, // Additional headers
      'X-Trace-Id': tracing.traceId,
      'X-Span-Id': tracing.spanId,
    },
  });

  if (!response.ok) {
    return await toError(response);
  } else {
    const data: unknown = await response.json();
    return data as T;
  }
};

const postOrPut = async <T, B = unknown>(
    url: string,
    action: 'POST' | 'PUT',
    body: B,
    headers: Record<string, string> = {},
  ): Promise<T | Err> => {
    const activeSpan = trace.getSpan(context.active());
    console.log('Active Span in Async http:', activeSpan?.spanContext().traceId);                

    // logger.info(`postOrPut - traceId = ${traceId}, spanId = ${spanId}`);
    const response = await fetch(url, {
      method: action,
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        ...headers, // Additional headers
        // 'X-Trace-Id': tracing.traceId,
        // 'X-Span-Id': tracing.spanId,
      },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      return await toError(response);
    } else {
      const data: unknown = await response.json();
      return data as T;
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