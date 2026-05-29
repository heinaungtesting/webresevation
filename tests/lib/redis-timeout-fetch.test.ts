import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redisTimeoutFetch } from '@/lib/redis-timeout-fetch';

describe('redisTimeoutFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should successfully complete a fast fetch request', async () => {
    const mockResponse = new Response('ok');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const resultPromise = redisTimeoutFetch('https://example.com');
    
    // Fast forward time, but not enough to trigger timeout
    vi.advanceTimersByTime(100);

    const result = await resultPromise;
    expect(result).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  it('should abort fetch request if it exceeds 1000ms', async () => {
    // Create a fetch that never resolves or takes a long time
    let abortSignal: AbortSignal | undefined;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      abortSignal = init?.signal;
      return new Promise((resolve, reject) => {
        // Reject if signal is aborted
        if (init?.signal?.aborted) {
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        }
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        });
      });
    });

    const resultPromise = redisTimeoutFetch('https://example.com');
    // Prevent unhandled rejection warnings during timer advancement
    resultPromise.catch(() => {});

    // Fast-forward by 1050ms to trigger the timeout
    await vi.advanceTimersByTimeAsync(1050);

    await expect(resultPromise).rejects.toThrow();
    expect(abortSignal?.aborted).toBe(true);
  });
});
