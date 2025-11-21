export type SportType =
  | 'badminton'
  | 'basketball'
  | 'volleyball'
  | 'tennis'
  | 'soccer'
  | 'futsal'
  | 'table-tennis'
  | 'other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type Language = 'en' | 'ja';

export type SessionVibe = 'COMPETITIVE' | 'CASUAL' | 'ACADEMY' | 'LANGUAGE_EXCHANGE';

export type LanguageLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE';

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  language_preference: Language;
  // Language exchange fields
  native_language?: string;
  target_language?: string;
  language_level?: LanguageLevel;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
}

export interface Participant {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface SportCenter {
  id: string;
  name_en: string;
  name_ja: string;
  address_en: string;
  address_ja: string;
  station_en?: string;
  station_ja?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

export interface Session {
  id: string;
  sport_center_id: string;
  sport_type: SportType;
  skill_level: SkillLevel;
  date_time: string;
  duration_minutes: number;
  max_participants?: number;
  current_participants: number;
  description_en?: string;
  description_ja?: string;
  // Language exchange & vibe fields
  primary_language?: string;
  allow_english?: boolean;
  vibe?: SessionVibe;
  created_by: string;
  created_at: string;
  sport_center?: SportCenter;
  participants?: Participant[];
}

export interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  marked_at: string;
  user?: User;
}
