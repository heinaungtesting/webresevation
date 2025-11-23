/**
 * OpenAPI Specification for SportsMatch Tokyo API
 *
 * This module exports the OpenAPI 3.0 specification for all API endpoints.
 * Used for documentation and can be served at /api/docs
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SportsMatch Tokyo API',
    description: 'API for the SportsMatch Tokyo sports session matching platform',
    version: '1.0.0',
    contact: {
      name: 'SportsMatch Tokyo Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: 'Sessions', description: 'Sports session management' },
    { name: 'Users', description: 'User profile and settings' },
    { name: 'Conversations', description: 'Messaging and chat' },
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Admin', description: 'Admin-only endpoints' },
    { name: 'Health', description: 'System health checks' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns the health status of the API and its dependencies',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '503': {
            description: 'Service is unhealthy',
          },
        },
      },
    },
    '/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'List sessions',
        description: 'Get a paginated list of sports sessions with optional filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'sport_type', in: 'query', schema: { type: 'string' } },
          { name: 'skill_level', in: 'query', schema: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] } },
          { name: 'vibe', in: 'query', schema: { type: 'string', enum: ['COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE'] } },
          { name: 'allow_english', in: 'query', schema: { type: 'boolean' } },
          { name: 'date', in: 'query', schema: { type: 'string', enum: ['today', 'weekend'] } },
          { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Sessions'],
        summary: 'Create session',
        description: 'Create a new sports session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSessionRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Session created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/sessions/{id}': {
      get: {
        tags: ['Sessions'],
        summary: 'Get session',
        description: 'Get details of a specific session',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Session details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          '404': { description: 'Session not found' },
        },
      },
      patch: {
        tags: ['Sessions'],
        summary: 'Update session',
        description: 'Update a session (creator only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateSessionRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Session updated' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Session not found' },
        },
      },
      delete: {
        tags: ['Sessions'],
        summary: 'Delete session',
        description: 'Delete a session (creator only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Session deleted' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Session not found' },
        },
      },
    },
    '/sessions/{id}/attendance': {
      post: {
        tags: ['Sessions'],
        summary: 'Join session',
        description: 'Join a sports session',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Joined session' },
          '400': { description: 'Session is full' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Sessions'],
        summary: 'Leave session',
        description: 'Leave a sports session',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Left session' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/conversations': {
      get: {
        tags: ['Conversations'],
        summary: 'List conversations',
        description: 'Get all conversations for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of conversations',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Conversation' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Conversations'],
        summary: 'Create conversation',
        description: 'Start a new conversation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateConversationRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Conversation created' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/conversations/{id}/messages': {
      get: {
        tags: ['Conversations'],
        summary: 'Get messages',
        description: 'Get messages in a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          '200': { description: 'List of messages' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Not a participant' },
        },
      },
      post: {
        tags: ['Conversations'],
        summary: 'Send message',
        description: 'Send a message in a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 5000 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Message sent' },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        description: 'Get the currently authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update profile',
        description: 'Update the current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/sessions': {
      get: {
        tags: ['Users'],
        summary: 'Get my sessions',
        description: 'Get sessions the current user has joined',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['upcoming', 'past'] } },
        ],
        responses: {
          '200': { description: 'List of sessions' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/reports': {
      post: {
        tags: ['Users'],
        summary: 'Submit report',
        description: 'Report a user or session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateReportRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Report submitted' },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up',
        description: 'Create a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Account created' },
          '400': { description: 'Invalid request' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'End the current session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
          checks: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  latency: { type: 'number' },
                },
              },
              redis: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                },
              },
            },
          },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sport_type: { type: 'string' },
          skill_level: { type: 'string' },
          date_time: { type: 'string', format: 'date-time' },
          duration_minutes: { type: 'integer' },
          max_participants: { type: 'integer', nullable: true },
          current_participants: { type: 'integer' },
          description_en: { type: 'string', nullable: true },
          description_ja: { type: 'string', nullable: true },
          vibe: { type: 'string', enum: ['COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE'] },
          allow_english: { type: 'boolean' },
          primary_language: { type: 'string' },
          sport_center: { $ref: '#/components/schemas/SportCenter' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      SessionListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Session' },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalCount: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNextPage: { type: 'boolean' },
              hasPrevPage: { type: 'boolean' },
            },
          },
        },
      },
      CreateSessionRequest: {
        type: 'object',
        required: ['sport_center_id', 'sport_type', 'skill_level', 'date_time', 'duration_minutes'],
        properties: {
          sport_center_id: { type: 'string', format: 'uuid' },
          sport_type: { type: 'string' },
          skill_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          date_time: { type: 'string', format: 'date-time' },
          duration_minutes: { type: 'integer', minimum: 1, maximum: 480 },
          max_participants: { type: 'integer', minimum: 2, nullable: true },
          description_en: { type: 'string', maxLength: 5000 },
          description_ja: { type: 'string', maxLength: 5000 },
          vibe: { type: 'string', enum: ['COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE'], default: 'CASUAL' },
          allow_english: { type: 'boolean', default: false },
          primary_language: { type: 'string', default: 'ja' },
        },
      },
      UpdateSessionRequest: {
        type: 'object',
        properties: {
          sport_type: { type: 'string' },
          skill_level: { type: 'string' },
          date_time: { type: 'string', format: 'date-time' },
          duration_minutes: { type: 'integer' },
          max_participants: { type: 'integer', nullable: true },
          description_en: { type: 'string' },
          description_ja: { type: 'string' },
          vibe: { type: 'string' },
          allow_english: { type: 'boolean' },
        },
      },
      SportCenter: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name_en: { type: 'string' },
          name_ja: { type: 'string' },
          address_en: { type: 'string' },
          address_ja: { type: 'string' },
          station_en: { type: 'string', nullable: true },
          station_ja: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string', nullable: true },
          display_name: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          sport_preferences: { type: 'array', items: { type: 'string' } },
          reliability_score: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          display_name: { type: 'string' },
          bio: { type: 'string' },
          location: { type: 'string' },
          sport_preferences: { type: 'array', items: { type: 'string' } },
          native_language: { type: 'string' },
          target_language: { type: 'string' },
          language_level: { type: 'string' },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['direct', 'session'] },
          participants: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          last_message_at: { type: 'string', format: 'date-time', nullable: true },
          unread_count: { type: 'integer' },
        },
      },
      CreateConversationRequest: {
        type: 'object',
        required: ['participant_ids'],
        properties: {
          participant_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
          session_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['direct', 'session'], default: 'direct' },
        },
      },
      CreateReportRequest: {
        type: 'object',
        required: ['entity_type', 'reason'],
        properties: {
          entity_type: { type: 'string', enum: ['USER', 'SESSION'] },
          reported_user_id: { type: 'string', format: 'uuid' },
          session_id: { type: 'string', format: 'uuid' },
          reason: { type: 'string', enum: ['HARASSMENT', 'NO_SHOW', 'SPAM', 'CREEPY_BEHAVIOR', 'FAKE_PROFILE', 'OTHER'] },
          description: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};
