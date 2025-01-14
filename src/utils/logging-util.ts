/* eslint-disable no-console */
import * as Sentry from '@sentry/react';
import React from 'react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';

interface Logger {
  info: (message: string) => void;
  debug: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

// Console-based logger
const createLoggerConsole = (): Logger => ({
  info: (message: string) => {
    console.log(`[info] ${message}`);
  },
  debug: (message: string) => {
    console.log(`[debug] ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[warn] ${message}`);
  },
  error: (message: string) => {
    console.error(`[error] ${message}`);
  },
});

// Sentry-based logger (created only if in production)
const createLoggerSentry = (): Logger => {
  Sentry.init({
    dsn: 'https://3fe2e01ba9affa2f98171d88ad29029c@o4508590198489088.ingest.de.sentry.io/4508590202683472',
    // dsn: process.env.REACT_APP_SENTRY_DSN,
    // integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),      
    ],

    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    // tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

  return {
    info: (message: string) => {
      Sentry.captureMessage(message, 'info');
    },
    debug: (message: string) => {
      Sentry.captureMessage(message, 'debug');
    },
    warn: (message: string) => {
      Sentry.captureMessage(message, 'warning');
    },
    error: (message: string) => {
      Sentry.captureMessage(message, 'error');
    },
  };
};

// Determine environment and choose logger
const isProd = process.env.NODE_ENV === 'production';
export const logger: Logger = isProd ? createLoggerSentry() : createLoggerConsole();
