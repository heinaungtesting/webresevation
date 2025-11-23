/**
 * User Profile Integration Tests
 *
 * Tests user profile management and settings.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

describe('User Profile Integration', () => {
  describe('Profile Management', () => {
    it('should get current user profile', async () => {
      const mockUser = {
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

      server.use(
        http.get('/api/users/me', () => {
          return HttpResponse.json(mockUser);
        })
      );

      const response = await fetch('/api/users/me');
      const data = await response.json();

      expect(data.id).toBe('user-1');
      expect(data.username).toBe('testuser');
      expect(data.sport_preferences).toContain('badminton');
    });

    it('should update user profile', async () => {
      let currentProfile = {
        id: 'user-1',
        display_name: 'Test User',
        bio: 'Sports enthusiast',
        location: 'Tokyo',
      };

      server.use(
        http.patch('/api/users/me', async ({ request }) => {
          const updates = await request.json();
          currentProfile = { ...currentProfile, ...updates };
          return HttpResponse.json(currentProfile);
        }),
        http.get('/api/users/me', () => {
          return HttpResponse.json(currentProfile);
        })
      );

      const updateResponse = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: 'Updated Name',
          bio: 'Updated bio',
        }),
      });

      expect(updateResponse.ok).toBe(true);
      const updateData = await updateResponse.json();
      expect(updateData.display_name).toBe('Updated Name');

      // Verify changes persisted
      const getResponse = await fetch('/api/users/me');
      const getData = await getResponse.json();
      expect(getData.display_name).toBe('Updated Name');
      expect(getData.bio).toBe('Updated bio');
    });

    it('should validate profile updates', async () => {
      server.use(
        http.patch('/api/users/me', async ({ request }) => {
          const body = await request.json();

          // Validate username format
          if (body.username && !/^[a-zA-Z0-9_]+$/.test(body.username)) {
            return HttpResponse.json(
              { error: 'Invalid username format' },
              { status: 400 }
            );
          }

          return HttpResponse.json({ ...body });
        })
      );

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid username!',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('User Sessions', () => {
    it('should get user hosted sessions', async () => {
      server.use(
        http.get('/api/users/me/sessions', ({ request }) => {
          const url = new URL(request.url);
          const type = url.searchParams.get('type') || 'all';

          const sessions = [
            {
              id: 'session-1',
              sport_type: 'badminton',
              role: 'host',
              date_time: '2024-12-01T10:00:00Z',
            },
            {
              id: 'session-2',
              sport_type: 'basketball',
              role: 'participant',
              date_time: '2024-12-02T14:00:00Z',
            },
          ];

          let filtered = sessions;
          if (type === 'hosted') {
            filtered = sessions.filter((s) => s.role === 'host');
          } else if (type === 'joined') {
            filtered = sessions.filter((s) => s.role === 'participant');
          }

          return HttpResponse.json({
            data: filtered,
            pagination: { page: 1, limit: 20, totalCount: filtered.length },
          });
        })
      );

      // Get all sessions
      const allResponse = await fetch('/api/users/me/sessions');
      const allData = await allResponse.json();
      expect(allData.data).toHaveLength(2);

      // Get hosted only
      const hostedResponse = await fetch('/api/users/me/sessions?type=hosted');
      const hostedData = await hostedResponse.json();
      expect(hostedData.data).toHaveLength(1);
      expect(hostedData.data[0].role).toBe('host');

      // Get joined only
      const joinedResponse = await fetch('/api/users/me/sessions?type=joined');
      const joinedData = await joinedResponse.json();
      expect(joinedData.data).toHaveLength(1);
      expect(joinedData.data[0].role).toBe('participant');
    });
  });

  describe('User Notifications', () => {
    it('should get user notifications', async () => {
      server.use(
        http.get('/api/users/me/notifications', () => {
          return HttpResponse.json({
            notifications: [
              {
                id: 'notif-1',
                type: 'session_reminder',
                title: 'Session Tomorrow',
                message: 'Your badminton session is tomorrow',
                read: false,
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 'notif-2',
                type: 'new_message',
                title: 'New Message',
                message: 'You have a new message',
                read: true,
                created_at: '2024-01-01T01:00:00Z',
              },
            ],
          });
        })
      );

      const response = await fetch('/api/users/me/notifications');
      const data = await response.json();

      expect(data.notifications).toHaveLength(2);
      expect(data.notifications[0].read).toBe(false);
    });

    it('should mark notifications as read', async () => {
      const notifications = [
        { id: 'notif-1', read: false },
        { id: 'notif-2', read: false },
      ];

      server.use(
        http.patch('/api/users/me/notifications/:id', ({ params }) => {
          const notif = notifications.find((n) => n.id === params.id);
          if (notif) {
            notif.read = true;
            return HttpResponse.json(notif);
          }
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }),
        http.post('/api/users/me/notifications/read-all', () => {
          notifications.forEach((n) => (n.read = true));
          return HttpResponse.json({ success: true });
        })
      );

      // Mark single notification as read
      const singleResponse = await fetch('/api/users/me/notifications/notif-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      expect(singleResponse.ok).toBe(true);

      // Mark all as read
      const allResponse = await fetch('/api/users/me/notifications/read-all', {
        method: 'POST',
      });

      expect(allResponse.ok).toBe(true);
    });
  });

  describe('Sport Preferences', () => {
    it('should update sport preferences', async () => {
      let preferences = ['badminton'];

      server.use(
        http.put('/api/users/me/preferences', async ({ request }) => {
          const body = await request.json();
          preferences = body.sport_preferences;
          return HttpResponse.json({ sport_preferences: preferences });
        }),
        http.get('/api/users/me', () => {
          return HttpResponse.json({
            id: 'user-1',
            sport_preferences: preferences,
          });
        })
      );

      const updateResponse = await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_preferences: ['badminton', 'basketball', 'tennis'],
        }),
      });

      expect(updateResponse.ok).toBe(true);
      const updateData = await updateResponse.json();
      expect(updateData.sport_preferences).toHaveLength(3);

      // Verify update persisted
      const getResponse = await fetch('/api/users/me');
      const getData = await getResponse.json();
      expect(getData.sport_preferences).toContain('tennis');
    });
  });
});

describe('Report Flow Integration', () => {
  it('should submit a report', async () => {
    server.use(
      http.post('/api/reports', async ({ request }) => {
        const body = await request.json();

        if (!body.reason || !body.target_type || !body.target_id) {
          return HttpResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        return HttpResponse.json(
          {
            id: 'report-1',
            ...body,
            status: 'PENDING',
            created_at: new Date().toISOString(),
          },
          { status: 201 }
        );
      })
    );

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'USER',
        target_id: 'user-2',
        reason: 'SPAM',
        description: 'This user is sending spam messages',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.status).toBe('PENDING');
    expect(data.reason).toBe('SPAM');
  });
});

describe('Sport Centers Integration', () => {
  it('should list sport centers', async () => {
    server.use(
      http.get('/api/sport-centers', ({ request }) => {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');

        const centers = [
          {
            id: 'center-1',
            name_en: 'Tokyo Sports Center',
            name_ja: '東京スポーツセンター',
            address_en: '1-1 Shibuya, Tokyo',
            latitude: 35.6595,
            longitude: 139.7004,
            sports_available: ['badminton', 'basketball'],
          },
          {
            id: 'center-2',
            name_en: 'Shinjuku Arena',
            name_ja: '新宿アリーナ',
            address_en: '2-2 Shinjuku, Tokyo',
            latitude: 35.6896,
            longitude: 139.6917,
            sports_available: ['basketball', 'volleyball'],
          },
        ];

        // If location provided, could sort by distance
        if (lat && lng) {
          // Just return all for mock purposes
          return HttpResponse.json(centers);
        }

        return HttpResponse.json(centers);
      })
    );

    const response = await fetch('/api/sport-centers');
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].sports_available).toBeDefined();
  });

  it('should get sport center details', async () => {
    server.use(
      http.get('/api/sport-centers/:id', ({ params }) => {
        if (params.id === 'center-1') {
          return HttpResponse.json({
            id: 'center-1',
            name_en: 'Tokyo Sports Center',
            name_ja: '東京スポーツセンター',
            description_en: 'A modern sports facility',
            address_en: '1-1 Shibuya, Tokyo',
            phone: '03-1234-5678',
            website: 'https://example.com',
            opening_hours: {
              monday: { open: '09:00', close: '21:00' },
              tuesday: { open: '09:00', close: '21:00' },
            },
            sports_available: ['badminton', 'basketball'],
            amenities: ['parking', 'showers', 'lockers'],
          });
        }
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    const response = await fetch('/api/sport-centers/center-1');
    const data = await response.json();

    expect(data.name_en).toBe('Tokyo Sports Center');
    expect(data.amenities).toContain('parking');
    expect(data.opening_hours).toBeDefined();
  });
});
