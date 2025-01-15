import { TraceManager, traceManager } from './trace-manager';

interface Logger {
  info: (message: string) => void;
  debug: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const logMessage = (tm: TraceManager, type: string, message: string) => {
  const trace = tm.getCurrentTrace();
  /* eslint-disable no-console */
  console.log(`${type} [${trace.traceId},${trace.spanId}] ${message}`);
};

// Console-based logger
const createLoggerConsole = (traceManager: TraceManager): Logger => ({
  info: (message: string) => {
    logMessage(traceManager, 'INFO ', message);
  },
  debug: (message: string) => {
    logMessage(traceManager, 'DEBUG', message);
  },
  warn: (message: string) => {
    logMessage(traceManager, 'WARN ', message);
  },
  error: (message: string) => {
    logMessage(traceManager, 'ERROR', message);
  },
});

export const logger: Logger = createLoggerConsole(traceManager);
