import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCorrelationId,
  extractCorrelationId,
  getOrCreateCorrelationId,
  createContextFromRequest,
  addTracingHeaders,
  createTracingHeaders,
  getLoggingContext,
  getCorrelationId,
  runWithContextAsync,
  createTimer,
} from '@/lib/tracing';

describe('Tracing Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCorrelationId', () => {
    it('should generate a valid UUID', () => {
      const id = generateCorrelationId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateCorrelationId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract from x-correlation-id header', () => {
      const headers = new Headers({ 'x-correlation-id': 'test-correlation-123' });
      expect(extractCorrelationId(headers)).toBe('test-correlation-123');
    });

    it('should extract from x-request-id header', () => {
      const headers = new Headers({ 'x-request-id': 'test-request-456' });
      expect(extractCorrelationId(headers)).toBe('test-request-456');
    });

    it('should extract from x-trace-id header', () => {
      const headers = new Headers({ 'x-trace-id': 'test-trace-789' });
      expect(extractCorrelationId(headers)).toBe('test-trace-789');
    });

    it('should extract trace-id from traceparent header', () => {
      const headers = new Headers({
        traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      });
      expect(extractCorrelationId(headers)).toBe('0af7651916cd43dd8448eb211c80319c');
    });

    it('should prioritize x-correlation-id over others', () => {
      const headers = new Headers({
        'x-correlation-id': 'correlation-id',
        'x-request-id': 'request-id',
        'x-trace-id': 'trace-id',
      });
      expect(extractCorrelationId(headers)).toBe('correlation-id');
    });

    it('should return null when no headers present', () => {
      const headers = new Headers();
      expect(extractCorrelationId(headers)).toBeNull();
    });
  });

  describe('getOrCreateCorrelationId', () => {
    it('should return existing ID if present', () => {
      const headers = new Headers({ 'x-correlation-id': 'existing-id' });
      expect(getOrCreateCorrelationId(headers)).toBe('existing-id');
    });

    it('should generate new ID if not present', () => {
      const headers = new Headers();
      const id = getOrCreateCorrelationId(headers);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('createContextFromRequest', () => {
    it('should create context with all fields', () => {
      const request = new Request('http://localhost/api/test?foo=bar', {
        method: 'POST',
        headers: { 'x-correlation-id': 'test-id' },
      });

      const context = createContextFromRequest(request);

      expect(context.correlationId).toBe('test-id');
      expect(context.path).toBe('/api/test');
      expect(context.method).toBe('POST');
      expect(context.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should generate correlation ID if not present', () => {
      const request = new Request('http://localhost/api/test');
      const context = createContextFromRequest(request);

      expect(context.correlationId).toBeDefined();
      expect(context.correlationId.length).toBeGreaterThan(0);
    });
  });

  describe('addTracingHeaders', () => {
    it('should add correlation ID to response', () => {
      const response = new Response('OK', { status: 200 });
      const context = {
        correlationId: 'test-correlation',
        startTime: Date.now() - 100,
      };

      const newResponse = addTracingHeaders(response, context);

      expect(newResponse.headers.get('x-correlation-id')).toBe('test-correlation');
    });

    it('should add response time header', () => {
      const response = new Response('OK', { status: 200 });
      const context = {
        correlationId: 'test-id',
        startTime: Date.now() - 150,
      };

      const newResponse = addTracingHeaders(response, context);
      const responseTime = newResponse.headers.get('x-response-time');

      expect(responseTime).toBeDefined();
      expect(responseTime).toMatch(/^\d+ms$/);
    });

    it('should preserve original response properties', () => {
      const response = new Response('Test body', {
        status: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json' },
      });
      const context = { correlationId: 'id', startTime: Date.now() };

      const newResponse = addTracingHeaders(response, context);

      expect(newResponse.status).toBe(201);
      expect(newResponse.statusText).toBe('Created');
      expect(newResponse.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('createTracingHeaders', () => {
    it('should return empty object when no context', () => {
      const headers = createTracingHeaders();
      expect(headers).toEqual({});
    });

    it('should return correlation ID when in context', async () => {
      const context = { correlationId: 'context-id', startTime: Date.now() };

      const headers = await runWithContextAsync(context, async () => {
        return createTracingHeaders();
      });

      expect(headers).toEqual({ 'x-correlation-id': 'context-id' });
    });
  });

  describe('runWithContextAsync', () => {
    it('should make correlation ID available in context', async () => {
      const context = { correlationId: 'async-context-id', startTime: Date.now() };

      const id = await runWithContextAsync(context, async () => {
        return getCorrelationId();
      });

      expect(id).toBe('async-context-id');
    });

    it('should clean up context after execution', async () => {
      const context = { correlationId: 'temp-id', startTime: Date.now() };

      await runWithContextAsync(context, async () => {
        expect(getCorrelationId()).toBe('temp-id');
      });

      // Context should be cleaned up
      expect(getCorrelationId()).toBeUndefined();
    });

    it('should handle errors and clean up context', async () => {
      const context = { correlationId: 'error-id', startTime: Date.now() };

      await expect(
        runWithContextAsync(context, async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      // Context should still be cleaned up
      expect(getCorrelationId()).toBeUndefined();
    });
  });

  describe('getLoggingContext', () => {
    it('should return empty object when no context', () => {
      expect(getLoggingContext()).toEqual({});
    });

    it('should return context fields', async () => {
      const context = {
        correlationId: 'log-id',
        startTime: Date.now(),
        path: '/api/test',
        method: 'GET',
        userId: 'user-123',
      };

      const loggingContext = await runWithContextAsync(context, async () => {
        return getLoggingContext();
      });

      expect(loggingContext).toEqual({
        correlationId: 'log-id',
        path: '/api/test',
        method: 'GET',
        userId: 'user-123',
      });
    });
  });

  describe('createTimer', () => {
    it('should measure operation duration', async () => {
      vi.useFakeTimers();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const context = { correlationId: 'timer-id', startTime: Date.now() };

      await runWithContextAsync(context, async () => {
        const endTimer = createTimer('test-operation');
        vi.advanceTimersByTime(100);
        endTimer();
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(logCall);

      expect(parsed.operation).toBe('test-operation');
      expect(parsed.correlationId).toBe('timer-id');
      expect(parsed.duration).toBeGreaterThanOrEqual(100);

      vi.useRealTimers();
      consoleSpy.mockRestore();
    });
  });
});
