// Types for Venue Booking System

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type VenuePartnerStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

// Court with basic info
export interface Court {
  id: string;
  sport_center_id: string;
  name_en: string;
  name_ja: string;
  sport_type: string;
  description_en?: string;
  description_ja?: string;
  price_per_hour: number;
  price_per_30min?: number;
  max_players: number;
  min_players: number;
  indoor: boolean;
  has_lighting: boolean;
  has_equipment: boolean;
  is_active: boolean;
}

// Time slot for booking
export interface TimeSlot {
  id: string;
  court_id: string;
  start_time: string; // "09:00" format
  end_time: string;
  is_available: boolean;
  price: number; // Price for this slot
}

// Venue with booking capability
export interface BookableVenue {
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
  description_en?: string;
  description_ja?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_bookable: boolean;
  courts: Court[];
  amenities: VenueAmenity[];
  operating_hours: OperatingHours[];
}

// Operating hours
export interface OperatingHours {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// Venue amenity
export interface VenueAmenity {
  id: string;
  name_en: string;
  name_ja: string;
  icon?: string;
  is_free: boolean;
  price?: number;
}

// Booking request
export interface CreateBookingRequest {
  court_id: string;
  booking_date: string; // ISO date string
  start_time: string; // "09:00" format
  end_time: string;
  session_id?: string; // Optional: link to sports session
  user_notes?: string;
}

// Booking response
export interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  session_id?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  subtotal: number;
  commission: number;
  total_amount: number;
  venue_payout: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  paid_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  user_notes?: string;
  venue_notes?: string;
  created_at: string;
  // Related entities
  court?: Court;
  venue?: {
    id: string;
    name_en: string;
    name_ja: string;
    address_en: string;
    address_ja: string;
  };
}

// Availability query
export interface AvailabilityQuery {
  venue_id: string;
  date: string; // ISO date string
  sport_type?: string;
}

// Availability response
export interface CourtAvailability {
  court: Court;
  slots: TimeSlot[];
}

// Booking calculation
export interface BookingCalculation {
  subtotal: number;
  commission: number;
  total_amount: number;
  venue_payout: number;
  duration_minutes: number;
}

// Venue search filters
export interface VenueSearchFilters {
  sport_type?: string;
  date?: string;
  min_price?: number;
  max_price?: number;
  indoor?: boolean;
  has_equipment?: boolean;
  near_station?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

// Venue partner application
export interface VenuePartnerApplication {
  sport_center_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  contact_person: string;
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
  terms_accepted: boolean;
}

// Commission summary for admin/venue
export interface CommissionSummary {
  total_bookings: number;
  total_revenue: number;
  total_commission: number;
  total_venue_payout: number;
  pending_payout: number;
  period_start: string;
  period_end: string;
}
