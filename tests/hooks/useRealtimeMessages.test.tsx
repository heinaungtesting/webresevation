import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages';

// Create a fresh mock channel for each test
const createMockChannel = () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      if (callback) callback('SUBSCRIBED');
      return channel;
    }),
    unsubscribe: vi.fn(),
  };
  return channel;
};

let mockChannel = createMockChannel();

const mockSupabase = {
  channel: vi.fn().mockImplementation(() => {
    mockChannel = createMockChannel();
    return mockChannel;
  }),
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  }),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useRealtimeMessages Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockChannel.on.mockReturnThis();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty messages and loading state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      // Note: isConnected may be true immediately due to sync mock
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when conversationId is null', () => {
      const { result } = renderHook(() => useRealtimeMessages(null));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Fetching Messages', () => {
    it('should fetch initial messages', async () => {
      const mockMessages = [
        { id: '1', content: 'Hello', sender_id: 'user-1', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', content: 'World', sender_id: 'user-2', created_at: '2024-01-01T00:01:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: mockMessages }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.messages).toEqual(mockMessages);
      expect(mockFetch).toHaveBeenCalledWith('/api/conversations/conv-123/messages');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch messages');
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('Sending Messages', () => {
    it('should send a message via API', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'new-msg', content: 'Test message' }),
        });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/conversations/conv-123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test message' }),
        })
      );
    });

    it('should not send empty messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      // Should only be called once for initial fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when send fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to send' }),
        });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // The error should be thrown
      await expect(
        act(async () => {
          await result.current.sendMessage('Test');
        })
      ).rejects.toThrow('Failed to send');
    });
  });

  describe('Refresh', () => {
    it('should refresh messages when called', async () => {
      const initialMessages = [{ id: '1', content: 'Initial' }];
      const refreshedMessages = [
        { id: '1', content: 'Initial' },
        { id: '2', content: 'New' },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: initialMessages }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: refreshedMessages }),
        });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.messages).toEqual(initialMessages);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.messages).toEqual(refreshedMessages);
    });
  });

  describe('Channel Subscription', () => {
    it('should create a channel for the conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:conv-123');
      });
    });

    it('should subscribe to postgres changes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: 'INSERT',
            schema: 'public',
            table: 'Message',
          }),
          expect.any(Function)
        );
      });
    });

    it('should call subscribe on the channel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      renderHook(() => useRealtimeMessages('conv-123'));

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe when conversationId becomes null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      const { rerender } = renderHook(
        ({ convId }) => useRealtimeMessages(convId),
        { initialProps: { convId: 'conv-1' as string | null } }
      );

      await waitFor(() => expect(mockChannel.subscribe).toHaveBeenCalled());

      // Change to null - should trigger cleanup
      rerender({ convId: null });

      // The unsubscribe should be called in cleanup
      await waitFor(() => {
        expect(mockChannel.unsubscribe).toHaveBeenCalled();
      });
    });
  });

  describe('Connection Status', () => {
    it('should update isConnected when subscription status changes', async () => {
      // Override subscribe to delay callback
      let subscribeCallback: ((status: string) => void) | null = null;
      const customChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          subscribeCallback = callback;
          // Don't call callback immediately
          return customChannel;
        }),
        unsubscribe: vi.fn(),
      };
      mockSupabase.channel.mockReturnValueOnce(customChannel);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      // Initially not connected since callback wasn't called
      expect(result.current.isConnected).toBe(false);

      // Now simulate connection success
      if (subscribeCallback) {
        act(() => {
          subscribeCallback!('SUBSCRIBED');
        });
      }

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should be connected after automatic subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ messages: [] }),
      });

      const { result } = renderHook(() => useRealtimeMessages('conv-123'));

      // With our default mock, subscribe callback is called immediately
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });
});
