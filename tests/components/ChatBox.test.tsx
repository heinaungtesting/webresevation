import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChatBox from '@/app/components/chat/ChatBox';

// Mock useConversationMessages hook
vi.mock('@/lib/realtime/client', () => ({
  useConversationMessages: vi.fn((id, callback) => {
    // Expose the callback to the test so we can trigger real-time messages manually
    (global as any).triggerRealtimeMessage = callback;
  }),
}));

// Mock csrfPost and csrfPut
vi.mock('@/lib/csrfClient', () => ({
  csrfPost: vi.fn(),
  csrfPut: vi.fn(),
}));

describe('ChatBox Component', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).triggerRealtimeMessage = null;
  });

  it('handles array format response from the API correctly', async () => {
    // Arrange: API returns array directly
    const mockMessages = [
      {
        id: 'msg-1',
        content: 'Hello World',
        sender_id: 'user-2',
        sender: { id: 'user-2', email: 'user2@example.com', username: 'user2' },
        created_at: new Date().toISOString(),
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    // Act
    render(<ChatBox conversationId="conv-1" currentUserId="user-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('handles object format response (data.messages) from the API correctly', async () => {
    // Arrange: API returns object with messages array
    const mockMessages = [
      {
        id: 'msg-2',
        content: 'Hello Object World',
        sender_id: 'user-2',
        sender: { id: 'user-2', email: 'user2@example.com', username: 'user2' },
        created_at: new Date().toISOString(),
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    });

    // Act
    render(<ChatBox conversationId="conv-1" currentUserId="user-1" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Hello Object World')).toBeInTheDocument();
    });
  });

  it('prevents duplicate messages in the real-time message callback', async () => {
    // Arrange: Initial message is msg-1
    const mockMessages = [
      {
        id: 'msg-1',
        content: 'Unique message',
        sender_id: 'user-2',
        sender: { id: 'user-2', email: 'user2@example.com', username: 'user2' },
        created_at: new Date().toISOString(),
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    render(<ChatBox conversationId="conv-1" currentUserId="user-1" />);

    // Wait for the initial load
    await waitFor(() => {
      expect(screen.getByText('Unique message')).toBeInTheDocument();
    });

    // Trigger the real-time callback with a duplicate message (same ID)
    const duplicateMsg = {
      id: 'msg-1',
      content: 'Unique message (duplicate content)',
      sender_id: 'user-2',
      sender: { id: 'user-2', email: 'user2@example.com', username: 'user2' },
      created_at: new Date().toISOString(),
    };

    if ((global as any).triggerRealtimeMessage) {
      (global as any).triggerRealtimeMessage(duplicateMsg);
    }

    // Verify only one message is rendered (no duplicate element)
    const renderedMessages = screen.getAllByText(/Unique message/);
    expect(renderedMessages.length).toBe(1);
  });
});
