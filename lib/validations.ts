import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 * Use these to validate request bodies and ensure type safety
 */

// Email validation with proper regex
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long');

// Password validation with strength requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Auth: Signup request validation
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  language: z.enum(['en', 'ja']).optional().default('en'),
  // Language exchange fields (optional)
  native_language: z.string().length(2).optional(),
  target_language: z.string().length(2).optional(),
  language_level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'NATIVE']).optional(),
});

// Auth: Login request validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Reviews: Create review validation
export const createReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string()
    .max(1000, 'Comment must be less than 1000 characters')
    .optional()
    .transform(val => val?.trim() || null),
});

// Reviews: Update review validation
export const updateReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  comment: z.string()
    .max(1000, 'Comment must be less than 1000 characters')
    .optional()
    .transform(val => val?.trim() || null),
});

// Conversations: Create conversation validation
export const createConversationSchema = z.object({
  type: z.enum(['direct', 'session']),
  participant_ids: z.array(uuidSchema)
    .min(1, 'At least one participant is required')
    .max(50, 'Too many participants'),
});

// Sessions: Create session validation
export const createSessionSchema = z.object({
  sport_center_id: uuidSchema,
  sport_type: z.enum(['badminton', 'basketball', 'volleyball', 'tennis', 'soccer', 'futsal', 'table-tennis']),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  date_time: z.string().datetime('Invalid datetime format'),
  duration_minutes: z.number()
    .int('Duration must be an integer')
    .min(30, 'Duration must be at least 30 minutes')
    .max(480, 'Duration must be less than 8 hours'),
  max_participants: z.number()
    .int('Max participants must be an integer')
    .min(2, 'Must allow at least 2 participants')
    .max(100, 'Too many participants')
    .nullable()
    .optional(),
  description_en: z.string()
    .max(2000, 'Description is too long')
    .nullable()
    .optional(),
  description_ja: z.string()
    .max(2000, 'Description is too long')
    .nullable()
    .optional(),
  primary_language: z.string().length(2, 'Invalid language code').optional().default('ja'),
  allow_english: z.boolean().optional().default(false),
  vibe: z.enum(['COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE']).optional().default('CASUAL'),
});

// Sessions: Update session validation
export const updateSessionSchema = createSessionSchema.partial();

// Report creation validation
export const createReportSchema = z.object({
  reported_user_id: uuidSchema,
  session_id: uuidSchema.optional(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'no_show', 'other']),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long'),
});

// Helper function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError.message
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
