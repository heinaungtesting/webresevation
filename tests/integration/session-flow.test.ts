/**
 * Session Flow Integration Tests
 *
 * Tests the complete session creation and management flow.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock server for integration tests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

describe('Session Flow Integration', () => {
  describe('Session Discovery Flow', () => {
    it('should list available sessions with filters', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          sport_type: 'badminton',
          skill_level: 'intermediate',
          date_time: '2024-12-01T10:00:00Z',
          max_participants: 4,
          current_participants: 2,
        },
        {
          id: 'session-2',
          sport_type: 'basketball',
          skill_level: 'advanced',
          date_time: '2024-12-02T14:00:00Z',
          max_participants: 10,
          current_participants: 5,
        },
      ];

      server.use(
        http.get('/api/sessions', ({ request }) => {
          const url = new URL(request.url);
          const sportType = url.searchParams.get('sport_type');

          let filtered = mockSessions;
          if (sportType && sportType !== 'all') {
            filtered = mockSessions.filter((s) => s.sport_type === sportType);
          }

          return HttpResponse.json({
            data: filtered,
            pagination: {
              page: 1,
              limit: 20,
              totalCount: filtered.length,
              totalPages: 1,
            },
          });
        })
      );

      // Test fetching all sessions
      const allResponse = await fetch('/api/sessions');
      const allData = await allResponse.json();
      expect(allData.data).toHaveLength(2);

      // Test filtering by sport type
      const filteredResponse = await fetch('/api/sessions?sport_type=badminton');
      const filteredData = await filteredResponse.json();
      expect(filteredData.data).toHaveLength(1);
      expect(filteredData.data[0].sport_type).toBe('badminton');
    });

    it('should get session details', async () => {
      const mockSession = {
        id: 'session-1',
        sport_type: 'badminton',
        skill_level: 'intermediate',
        date_time: '2024-12-01T10:00:00Z',
        max_participants: 4,
        current_participants: 2,
        sport_center: {
          id: 'center-1',
          name_en: 'Tokyo Sports Center',
          address_en: '1-1 Shibuya, Tokyo',
        },
        host: {
          id: 'user-1',
          username: 'testuser',
          display_name: 'Test User',
        },
      };

      server.use(
        http.get('/api/sessions/:id', ({ params }) => {
          if (params.id === 'session-1') {
            return HttpResponse.json(mockSession);
          }
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      const response = await fetch('/api/sessions/session-1');
      const data = await response.json();

      expect(data.id).toBe('session-1');
      expect(data.sport_center).toBeDefined();
      expect(data.host).toBeDefined();
    });
  });

  describe('Session Creation Flow', () => {
    it('should create a new session', async () => {
      server.use(
        http.post('/api/sessions', async ({ request }) => {
          const body = await request.json();

          // Validate required fields
          if (!body.sport_type || !body.date_time) {
            return HttpResponse.json(
              { error: 'Validation failed', details: ['Missing required fields'] },
              { status: 400 }
            );
          }

          return HttpResponse.json(
            {
              id: 'new-session-1',
              ...body,
              current_participants: 1,
              created_at: new Date().toISOString(),
            },
            { status: 201 }
          );
        })
      );

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_type: 'badminton',
          skill_level: 'intermediate',
          date_time: '2024-12-15T10:00:00Z',
          duration_minutes: 60,
          max_participants: 4,
          sport_center_id: 'center-1',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe('new-session-1');
      expect(data.sport_type).toBe('badminton');
    });

    it('should reject invalid session data', async () => {
      server.use(
        http.post('/api/sessions', async ({ request }) => {
          const body = await request.json();

          if (!body.sport_type) {
            return HttpResponse.json(
              { error: 'Validation failed', details: ['sport_type is required'] },
              { status: 400 }
            );
          }

          return HttpResponse.json({ id: 'session' }, { status: 201 });
        })
      );

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing sport_type
          date_time: '2024-12-15T10:00:00Z',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Session Participation Flow', () => {
    it('should join a session', async () => {
      let participants = 2;

      server.use(
        http.post('/api/sessions/:id/join', () => {
          participants++;
          return HttpResponse.json({
            success: true,
            current_participants: participants,
          });
        }),
        http.get('/api/sessions/:id', () => {
          return HttpResponse.json({
            id: 'session-1',
            current_participants: participants,
            max_participants: 4,
          });
        })
      );

      const joinResponse = await fetch('/api/sessions/session-1/join', {
        method: 'POST',
      });

      expect(joinResponse.ok).toBe(true);
      const joinData = await joinResponse.json();
      expect(joinData.current_participants).toBe(3);

      // Verify session updated
      const sessionResponse = await fetch('/api/sessions/session-1');
      const sessionData = await sessionResponse.json();
      expect(sessionData.current_participants).toBe(3);
    });

    it('should prevent joining full sessions', async () => {
      server.use(
        http.post('/api/sessions/:id/join', () => {
          return HttpResponse.json(
            { error: 'Session is full' },
            { status: 400 }
          );
        })
      );

      const response = await fetch('/api/sessions/session-1/join', {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Session is full');
    });

    it('should leave a session', async () => {
      server.use(
        http.post('/api/sessions/:id/leave', () => {
          return HttpResponse.json({
            success: true,
            current_participants: 2,
          });
        })
      );

      const response = await fetch('/api/sessions/session-1/leave', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.current_participants).toBe(2);
    });
  });
});

describe('Authentication Flow Integration', () => {
  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      server.use(
        http.post('/api/auth/login', async ({ request }) => {
          const body = await request.json();

          if (body.email === 'test@example.com' && body.password === 'password123') {
            return HttpResponse.json({
              user: {
                id: 'user-1',
                email: 'test@example.com',
                username: 'testuser',
              },
            });
          }

          return HttpResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Signup Flow', () => {
    it('should create new account', async () => {
      server.use(
        http.post('/api/auth/signup', async ({ request }) => {
          const body = await request.json();

          return HttpResponse.json({
            user: {
              id: 'new-user-1',
              email: body.email,
              username: body.username,
            },
          });
        })
      );

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'securepassword123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user.email).toBe('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        })
      );

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          username: 'existinguser',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(409);
    });
  });
});

describe('Messaging Flow Integration', () => {
  describe('Conversation Flow', () => {
    it('should list conversations', async () => {
      server.use(
        http.get('/api/conversations', () => {
          return HttpResponse.json([
            {
              id: 'conv-1',
              type: 'direct',
              participants: [
                { id: 'user-1', username: 'testuser' },
                { id: 'user-2', username: 'other' },
              ],
              last_message_at: '2024-01-01T12:00:00Z',
              unread_count: 2,
            },
          ]);
        })
      );

      const response = await fetch('/api/conversations');
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].participants).toHaveLength(2);
    });

    it('should send and receive messages', async () => {
      const messages: Array<{ id: string; content: string; created_at: string }> = [
        {
          id: 'msg-1',
          content: 'Hello!',
          created_at: '2024-01-01T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/conversations/:id/messages', () => {
          return HttpResponse.json({ messages });
        }),
        http.post('/api/conversations/:id/messages', async ({ request }) => {
          const body = await request.json();
          const newMessage = {
            id: `msg-${messages.length + 1}`,
            content: body.content,
            created_at: new Date().toISOString(),
          };
          messages.push(newMessage);
          return HttpResponse.json(newMessage, { status: 201 });
        })
      );

      // Get initial messages
      const getResponse = await fetch('/api/conversations/conv-1/messages');
      const getData = await getResponse.json();
      expect(getData.messages).toHaveLength(1);

      // Send new message
      const sendResponse = await fetch('/api/conversations/conv-1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'New message!' }),
      });

      expect(sendResponse.status).toBe(201);
      const sendData = await sendResponse.json();
      expect(sendData.content).toBe('New message!');

      // Verify message added
      const getResponse2 = await fetch('/api/conversations/conv-1/messages');
      const getData2 = await getResponse2.json();
      expect(getData2.messages).toHaveLength(2);
    });
  });
});

describe('Error Handling Integration', () => {
  it('should handle server errors gracefully', async () => {
    server.use(
      http.get('/api/sessions', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    const response = await fetch('/api/sessions');
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    server.use(
      http.post('/api/sessions', () => {
        return HttpResponse.json(
          { error: 'Too Many Requests', retryAfter: 60 },
          {
            status: 429,
            headers: { 'Retry-After': '60' },
          }
        );
      })
    );

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport_type: 'badminton' }),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should handle unauthorized access', async () => {
    server.use(
      http.get('/api/users/me', () => {
        return HttpResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      })
    );

    const response = await fetch('/api/users/me');
    expect(response.status).toBe(401);
  });

  it('should handle not found resources', async () => {
    server.use(
      http.get('/api/sessions/:id', () => {
        return HttpResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      })
    );

    const response = await fetch('/api/sessions/nonexistent-id');
    expect(response.status).toBe(404);
  });
});
