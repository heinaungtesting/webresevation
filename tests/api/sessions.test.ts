import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/sessions/route';
import { NextRequest } from 'next/server';

// Apply mocks using factory functions
vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn(),
    },
  }),
}));

describe('Sessions API Routes', () => {
  let mockPrisma: any;
  let mockAuth: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get references to the mocked modules
    const { prisma } = await import('@/lib/prisma');
    const { createClient } = await import('@/lib/supabase/server');

    mockPrisma = prisma;
    const client = await (createClient as any)();
    mockAuth = client.auth;
  });

  describe('GET /api/sessions', () => {
    const mockSessionsData = [
      {
        id: 'session-1',
        sport_type: 'basketball',
        skill_level: 'beginner',
        date_time: new Date('2024-12-30T14:00:00Z'),
        duration_minutes: 90,
        max_participants: 10,
        description_en: 'Fun basketball session',
        sport_center: {
          id: 'center-1',
          name_en: 'Tokyo Sports Center',
          name_ja: '東京スポーツセンター'
        },
        _count: { user_sessions: 5 },
        vibe: 'CASUAL',
        allow_english: true,
        primary_language: 'ja',
      },
      {
        id: 'session-2',
        sport_type: 'tennis',
        skill_level: 'intermediate',
        date_time: new Date('2024-12-31T10:00:00Z'),
        duration_minutes: 60,
        max_participants: 4,
        description_en: 'Tennis practice',
        sport_center: {
          id: 'center-2',
          name_en: 'Shibuya Tennis Club',
          name_ja: '渋谷テニスクラブ'
        },
        _count: { user_sessions: 2 },
        vibe: 'COMPETITIVE',
        allow_english: false,
        primary_language: 'ja',
      },
    ];

    beforeEach(() => {
      mockPrisma.session.findMany.mockResolvedValue(mockSessionsData);
      mockPrisma.session.count.mockResolvedValue(2);
    });

    it('should return all sessions when no filters applied', async () => {
      const request = new Request('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(2);

      // Verify session structure
      expect(data.data[0]).toMatchObject({
        id: 'session-1',
        sport_type: 'basketball',
        current_participants: 5
      });

      expect(data.data[0]).not.toHaveProperty('_count');

      // Verify pagination structure
      expect(data.pagination).toBeDefined();
      expect(data.pagination).toMatchObject({
        page: 1,
        totalCount: 2,
      });
    });

    it('should filter by sport type', async () => {
      const request = new Request('http://localhost:3000/api/sessions?sport_type=basketball');
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sport_type: 'basketball'
          })
        })
      );
    });

    it('should filter by skill level', async () => {
      const request = new Request('http://localhost:3000/api/sessions?skill_level=intermediate');
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skill_level: 'intermediate'
          })
        })
      );
    });

    it('should filter by vibe', async () => {
      const request = new Request('http://localhost:3000/api/sessions?vibe=COMPETITIVE');
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vibe: 'COMPETITIVE'
          })
        })
      );
    });

    it('should filter by English allowance', async () => {
      const request = new Request('http://localhost:3000/api/sessions?allow_english=true');
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            allow_english: true
          })
        })
      );
    });

    it('should handle search across multiple fields', async () => {
      const request = new Request('http://localhost:3000/api/sessions?search=basketball');
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { sport_type: { contains: 'basketball', mode: 'insensitive' } },
              { sport_center: { name_en: { contains: 'basketball', mode: 'insensitive' } } },
              { sport_center: { name_ja: { contains: 'basketball', mode: 'insensitive' } } }
            ]
          })
        })
      );
    });

    it('should handle today filter', async () => {
      const request = new Request('http://localhost:3000/api/sessions?date=today');
      await GET(request);

      const calledWith = mockPrisma.session.findMany.mock.calls[0][0];
      expect(calledWith.where.date_time).toHaveProperty('gte');
      expect(calledWith.where.date_time).toHaveProperty('lte');
    });

    it('should handle weekend filter', async () => {
      const request = new Request('http://localhost:3000/api/sessions?date=weekend');
      await GET(request);

      const calledWith = mockPrisma.session.findMany.mock.calls[0][0];
      expect(calledWith.where.date_time).toHaveProperty('gte');
      expect(calledWith.where.date_time).toHaveProperty('lte');
    });

    it('should handle custom date range', async () => {
      const request = new Request('http://localhost:3000/api/sessions?start_date=2024-12-25&end_date=2024-12-31');
      await GET(request);

      const calledWith = mockPrisma.session.findMany.mock.calls[0][0];
      expect(calledWith.where.date_time).toHaveProperty('gte');
      expect(calledWith.where.date_time).toHaveProperty('lte');
    });

    it('should ignore invalid vibe values', async () => {
      const request = new Request('http://localhost:3000/api/sessions?vibe=INVALID');
      await GET(request);

      const calledWith = mockPrisma.session.findMany.mock.calls[0][0];
      expect(calledWith.where).not.toHaveProperty('vibe');
    });

    it('should ignore "all" filter values', async () => {
      const request = new Request('http://localhost:3000/api/sessions?sport_type=all&skill_level=all');
      await GET(request);

      const calledWith = mockPrisma.session.findMany.mock.calls[0][0];
      expect(calledWith.where).not.toHaveProperty('sport_type');
      expect(calledWith.where).not.toHaveProperty('skill_level');
    });

    it('should handle multiple filters together', async () => {
      const request = new Request(
        'http://localhost:3000/api/sessions?sport_type=basketball&skill_level=beginner&vibe=CASUAL&allow_english=true'
      );
      await GET(request);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sport_type: 'basketball',
            skill_level: 'beginner',
            vibe: 'CASUAL',
            allow_english: true
          })
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.session.findMany.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch sessions'
      });
    });

    it('should return empty array when no sessions found', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.count.mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.totalCount).toBe(0);
    });
  });

  describe('POST /api/sessions', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    const validSessionData = {
      sport_center_id: '123e4567-e89b-12d3-a456-426614174000',
      sport_type: 'basketball',
      skill_level: 'beginner',
      date_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration_minutes: 90,
      max_participants: 10,
      description_en: 'Fun basketball session',
      description_ja: 'バスケットボールの楽しいセッション',
      primary_language: 'ja',
      allow_english: true,
      vibe: 'CASUAL'
    };

    const mockCreatedSession = {
      id: 'session-123',
      ...validSessionData,
      date_time: new Date(validSessionData.date_time),
      created_by: mockUser.id,
      sport_center: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name_en: 'Test Center'
      },
      _count: { user_sessions: 1 }
    };

    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          session: {
            create: vi.fn().mockResolvedValue({ ...mockCreatedSession, id: 'new-session' }),
            findUnique: vi.fn().mockResolvedValue(mockCreatedSession)
          },
          userSession: {
            create: vi.fn().mockResolvedValue({})
          }
        });
      });
    });

    it('should create a new session successfully', async () => {
      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSessionData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: 'session-123',
        sport_type: 'basketball',
        skill_level: 'beginner',
        current_participants: 1
      });

      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSessionData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        sport_type: 'basketball',
        // Missing required fields
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid input');
    });

    it('should validate UUID format for sport_center_id', async () => {
      const invalidData = {
        ...validSessionData,
        sport_center_id: 'invalid-uuid'
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid sport center ID');
    });

    it('should validate skill level enum', async () => {
      const invalidData = {
        ...validSessionData,
        skill_level: 'expert' // Invalid skill level
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate date is in the future', async () => {
      const invalidData = {
        ...validSessionData,
        date_time: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Session date must be in the future');
    });

    it('should validate duration limits', async () => {
      const invalidData = {
        ...validSessionData,
        duration_minutes: 500 // Exceeds 8 hours (480 minutes)
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Duration cannot exceed 8 hours');
    });

    it('should handle string duration and convert to number', async () => {
      const dataWithStringDuration = {
        ...validSessionData,
        duration_minutes: '120' // String instead of number
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithStringDuration)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should validate max_participants minimum', async () => {
      const invalidData = {
        ...validSessionData,
        max_participants: 1 // Less than minimum of 2
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Must allow at least 2 participants');
    });

    it('should handle null max_participants', async () => {
      const dataWithNullMax = {
        ...validSessionData,
        max_participants: null
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithNullMax)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should validate description length', async () => {
      const invalidData = {
        ...validSessionData,
        description_en: 'x'.repeat(5001) // Exceeds 5000 character limit
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Description too long');
    });

    it('should validate primary_language format', async () => {
      const invalidData = {
        ...validSessionData,
        primary_language: 'english' // Should be 2-character code
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Language code must be 2 characters');
    });

    it('should validate vibe enum', async () => {
      const invalidData = {
        ...validSessionData,
        vibe: 'INVALID_VIBE'
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should use default values when optional fields omitted', async () => {
      const minimalData = {
        sport_center_id: '123e4567-e89b-12d3-a456-426614174000',
        sport_type: 'basketball',
        skill_level: 'beginner',
        date_time: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 90
      };

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalData)
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should handle database transaction errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSessionData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to create session'
      });
    });

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should auto-join creator to session', async () => {
      const transactionMock = vi.fn();
      let sessionCreateMock: any;
      let userSessionCreateMock: any;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        sessionCreateMock = vi.fn().mockResolvedValue({ id: 'new-session' });
        userSessionCreateMock = vi.fn().mockResolvedValue({});

        const txMock = {
          session: {
            create: sessionCreateMock,
            findUnique: vi.fn().mockResolvedValue(mockCreatedSession)
          },
          userSession: {
            create: userSessionCreateMock
          }
        };

        return callback(txMock);
      });

      const request = new Request('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSessionData)
      });

      await POST(request);

      // Verify auto-join was called
      expect(userSessionCreateMock).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          session_id: 'new-session'
        }
      });
    });
  });
});