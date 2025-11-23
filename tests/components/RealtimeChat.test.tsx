import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealtimeChat } from '@/components/chat/RealtimeChat';

// Mock the hooks
vi.mock('@/lib/hooks/useRealtimeMessages', () => ({
  useRealtimeMessages: vi.fn(),
}));

vi.mock('@/lib/hooks/useTypingIndicator', () => ({
  useTypingIndicator: vi.fn(() => ({
    typingUsers: [],
    setTyping: vi.fn(),
    isUserTyping: vi.fn(() => false),
  })),
}));

import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator';

const mockCurrentUser = {
  id: 'user-1',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
};

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Hello!',
    created_at: '2024-01-01T10:00:00Z',
    sender: { id: 'user-1', username: 'testuser', display_name: 'Test User', avatar_url: null },
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    content: 'Hi there!',
    created_at: '2024-01-01T10:01:00Z',
    sender: { id: 'user-2', username: 'other', display_name: 'Other User', avatar_url: null },
  },
];

describe('RealtimeChat Component', () => {
  const mockSendMessage = vi.fn();
  const mockRefresh = vi.fn();
  const mockSetTyping = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRealtimeMessages).mockReturnValue({
      messages: mockMessages,
      sendMessage: mockSendMessage,
      isConnected: true,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });

    vi.mocked(useTypingIndicator).mockReturnValue({
      typingUsers: [],
      setTyping: mockSetTyping,
      isUserTyping: vi.fn(() => false),
    });
  });

  describe('Rendering', () => {
    it('should render the chat container', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should render messages', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText('Hello!')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      vi.mocked(useRealtimeMessages).mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        isConnected: true,
        isLoading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      vi.mocked(useRealtimeMessages).mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        isConnected: true,
        isLoading: false,
        error: 'Failed to load messages',
        refresh: mockRefresh,
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText('Failed to load messages')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      vi.mocked(useRealtimeMessages).mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        isConnected: true,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
    });

    it('should show connection status when disconnected', () => {
      vi.mocked(useRealtimeMessages).mockReturnValue({
        messages: mockMessages,
        sendMessage: mockSendMessage,
        isConnected: false,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should style own messages differently', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      // Own message should not show sender name
      const ownMessage = screen.getByText('Hello!');
      expect(ownMessage.parentElement).not.toHaveTextContent('Test User');
    });

    it('should show sender name for other messages', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      // Other user's message should show sender name
      expect(screen.getByText('Other User')).toBeInTheDocument();
    });

    it('should display message timestamps', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      // Timestamps should be visible (format may vary by locale)
      const timeElements = document.querySelectorAll('[class*="text-xs"]');
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sending Messages', () => {
    it('should send message on form submit', async () => {
      const user = userEvent.setup();

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'New message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith('New message');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      mockSendMessage.mockResolvedValue(undefined);

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'New message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should disable send button when input is empty', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when disconnected', async () => {
      vi.mocked(useRealtimeMessages).mockReturnValue({
        messages: mockMessages,
        sendMessage: mockSendMessage,
        isConnected: false,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
      });

      const user = userEvent.setup();

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '   ');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Typing Indicator', () => {
    it('should call setTyping when user types', async () => {
      const user = userEvent.setup();

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'a');

      expect(mockSetTyping).toHaveBeenCalledWith(true);
    });

    it('should display typing indicator when others are typing', () => {
      vi.mocked(useTypingIndicator).mockReturnValue({
        typingUsers: [{ userId: 'user-2', username: 'OtherUser', startedAt: Date.now() }],
        setTyping: mockSetTyping,
        isUserTyping: vi.fn(() => true),
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText(/OtherUser is typing.../)).toBeInTheDocument();
    });

    it('should display plural typing indicator for multiple users', () => {
      vi.mocked(useTypingIndicator).mockReturnValue({
        typingUsers: [
          { userId: 'user-2', username: 'User1', startedAt: Date.now() },
          { userId: 'user-3', username: 'User2', startedAt: Date.now() },
        ],
        setTyping: mockSetTyping,
        isUserTyping: vi.fn(() => true),
      });

      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      expect(screen.getByText(/are typing.../)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input field', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have accessible send button', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should respect maxLength on input', () => {
      render(
        <RealtimeChat conversationId="conv-1" currentUser={mockCurrentUser} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input).toHaveAttribute('maxLength', '5000');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <RealtimeChat
          conversationId="conv-1"
          currentUser={mockCurrentUser}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
