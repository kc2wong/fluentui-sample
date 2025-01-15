import { v4 as uuidv4 } from 'uuid';

type Tracing = { traceId: string; spanId: string };

export interface TraceManager {
  getCurrentTrace: () => Tracing;
  newTrace: () => Tracing;
  newSpan: () => Tracing;
  endSpan: () => void;
  isEmptyTrace: () => boolean;
}

class TraceManagerImpl implements TraceManager {
  private traceId?: string;
  private currentSpanId?: string;
  private spanStack: string[] = [];

  newTrace = (): Tracing => {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    this.traceId = traceId;
    this.currentSpanId = spanId;
    this.spanStack = [spanId];
    return { traceId, spanId };
  };

  newSpan = (): Tracing => {
    if (!this.traceId) {
      return this.newTrace();
    } else {
      const newSpanId = this.generateSpanId();
      this.spanStack.push(newSpanId);
      this.currentSpanId = newSpanId;
      return { traceId: this.traceId, spanId: newSpanId };
    }
  };

  endSpan = (): void => {
    if (this.traceId && this.spanStack.length > 0) {
      this.spanStack.pop();
      this.currentSpanId = this.spanStack[this.spanStack.length - 1] || undefined;
      if (this.currentSpanId === undefined) {
        this.traceId = undefined;
      }
    }
  };

  isEmptyTrace = (): boolean => {
    return this.traceId === undefined;
  };

  getCurrentTrace = (): Tracing => {
    if (!this.traceId || !this.currentSpanId) {
      return this.newTrace();
    }
    return { traceId: this.traceId, spanId: this.currentSpanId };
  };

  private generateTraceId(): string {
    // OpenTelemetry traceId is 16 bytes, typically represented as a UUIDv4
    return uuidv4().replace(/-/g, ''); // Remove hyphens for compact representation
  }

  private generateSpanId(): string {
    // OpenTelemetry spanId is 8 bytes, using part of UUIDv4 (we can take the first 16 characters)
    return uuidv4().replace(/-/g, '').substring(0, 16); // Get the first 16 characters
  }
}

export const traceManager: TraceManager = new TraceManagerImpl();
