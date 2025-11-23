/**
 * MSW Request Handlers
 *
 * Mock API handlers for integration testing.
 * Uses Mock Service Worker (MSW) to intercept HTTP requests.
 */

import { http, HttpResponse } from 'msw';

// Sample data
export const mockSessions = [
  {
    id: 'session-1',
    sport_type: 'badminton',
    skill_level: 'intermediate',
    date_time: '2024-12-01T10:00:00Z',
    duration_minutes: 60,
    max_participants: 4,
    current_participants: 2,
    vibe: 'CASUAL',
    allow_english: true,
    primary_language: 'ja',
    sport_center: {
      id: 'center-1',
      name_en: 'Tokyo Sports Center',
      name_ja: '東京スポーツセンター',
      address_en: '1-1 Shibuya, Tokyo',
      address_ja: '東京都渋谷区1-1',
    },
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'session-2',
    sport_type: 'basketball',
    skill_level: 'advanced',
    date_time: '2024-12-02T14:00:00Z',
    duration_minutes: 90,
    max_participants: 10,
    current_participants: 5,
    vibe: 'COMPETITIVE',
    allow_english: false,
    primary_language: 'ja',
    sport_center: {
      id: 'center-2',
      name_en: 'Shinjuku Arena',
      name_ja: '新宿アリーナ',
      address_en: '2-2 Shinjuku, Tokyo',
      address_ja: '東京都新宿区2-2',
    },
    created_at: '2024-01-02T00:00:00Z',
  },
];

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Sports enthusiast',
  avatar_url: null,
  location: 'Tokyo',
  sport_preferences: ['badminton', 'basketball'],
  reliability_score: 95,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockConversations = [
  {
    id: 'conv-1',
    type: 'direct',
    participants: [
      { id: 'user-1', username: 'testuser', display_name: 'Test User' },
      { id: 'user-2', username: 'other', display_name: 'Other User' },
    ],
    last_message_at: '2024-01-01T12:00:00Z',
    unread_count: 2,
  },
];

export const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Hey!',
    created_at: '2024-01-01T10:00:00Z',
    sender: { id: 'user-1', username: 'testuser', display_name: 'Test User' },
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    content: 'Hello!',
    created_at: '2024-01-01T10:01:00Z',
    sender: { id: 'user-2', username: 'other', display_name: 'Other User' },
  },
];

// Request handlers
export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: { status: 'connected', latency: 5 },
        redis: { status: 'connected' },
      },
    });
  }),

  // Sessions
  http.get('/api/sessions', ({ request }) => {
    const url = new URL(request.url);
    const sportType = url.searchParams.get('sport_type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let filteredSessions = mockSessions;
    if (sportType && sportType !== 'all') {
      filteredSessions = mockSessions.filter((s) => s.sport_type === sportType);
    }

    return HttpResponse.json({
      data: filteredSessions,
      pagination: {
        page,
        limit,
        totalCount: filteredSessions.length,
        totalPages: Math.ceil(filteredSessions.length / limit),
        hasNextPage: false,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.get('/api/sessions/:id', ({ params }) => {
    const session = mockSessions.find((s) => s.id === params.id);
    if (!session) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return HttpResponse.json(session);
  }),

  http.post('/api/sessions', async ({ request }) => {
    const body = await request.json();
    const newSession = {
      id: `session-${Date.now()}`,
      ...body,
      current_participants: 1,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(newSession, { status: 201 });
  }),

  // Conversations
  http.get('/api/conversations', () => {
    return HttpResponse.json(mockConversations);
  }),

  http.get('/api/conversations/:id/messages', ({ params }) => {
    const messages = mockMessages.filter((m) => m.conversation_id === params.id);
    return HttpResponse.json({ messages });
  }),

  http.post('/api/conversations/:id/messages', async ({ request, params }) => {
    const body = await request.json();
    const newMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: params.id,
      sender_id: 'user-1',
      content: body.content,
      created_at: new Date().toISOString(),
      sender: mockUser,
    };
    return HttpResponse.json(newMessage, { status: 201 });
  }),

  // Users
  http.get('/api/users/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockUser, ...body });
  }),

  http.get('/api/users/me/sessions', () => {
    return HttpResponse.json({
      data: mockSessions.slice(0, 1),
      pagination: { page: 1, limit: 20, totalCount: 1, totalPages: 1 },
    });
  }),

  http.get('/api/users/me/notifications', () => {
    return HttpResponse.json({
      notifications: [
        {
          id: 'notif-1',
          type: 'session_reminder',
          title: 'Session Tomorrow',
          message: 'Your badminton session is tomorrow at 10:00 AM',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),

  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ user: mockUser });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: { ...mockUser, email: body.email },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Sport Centers
  http.get('/api/sport-centers', () => {
    return HttpResponse.json([
      mockSessions[0].sport_center,
      mockSessions[1].sport_center,
    ]);
  }),

  // CSRF Token
  http.get('/api/csrf', () => {
    return HttpResponse.json({ token: 'mock-csrf-token' });
  }),

  // Reports
  http.post('/api/reports', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 'report-1', ...body, status: 'PENDING' },
      { status: 201 }
    );
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  serverError: http.get('/api/sessions', () => {
    return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }),

  notFound: http.get('/api/sessions/:id', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  unauthorized: http.get('/api/users/me', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }),

  rateLimited: http.post('/api/sessions', () => {
    return HttpResponse.json(
      { error: 'Too Many Requests', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }),

  validationError: http.post('/api/sessions', () => {
    return HttpResponse.json(
      { error: 'Validation failed', details: ['Sport type is required'] },
      { status: 400 }
    );
  }),
};
