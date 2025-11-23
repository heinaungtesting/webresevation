// Venue Booking Service
// Business logic for court availability, pricing, and booking management

import type {
  BookingCalculation,
  TimeSlot,
  CourtAvailability,
  CreateBookingRequest,
} from '@/types/venue-booking';

// Default commission rate (10%)
export const DEFAULT_COMMISSION_RATE = 0.10;

// Booking time constraints
export const MIN_BOOKING_HOURS_AHEAD = 2; // Minimum hours before booking
export const MAX_BOOKING_DAYS_AHEAD = 30; // Maximum days in advance

// Cancellation policy
export const FREE_CANCELLATION_HOURS = 24; // Free cancellation if 24h+ before
export const PARTIAL_REFUND_HOURS = 12; // 50% refund if 12-24h before
export const PARTIAL_REFUND_RATE = 0.5;

/**
 * Calculate booking price based on court and duration
 */
export function calculateBookingPrice(
  pricePerHour: number,
  pricePerHalfHour: number | null,
  durationMinutes: number,
  commissionRate: number = DEFAULT_COMMISSION_RATE
): BookingCalculation {
  let subtotal: number;

  if (durationMinutes === 30 && pricePerHalfHour) {
    subtotal = pricePerHalfHour;
  } else {
    // Calculate based on hourly rate
    const hours = durationMinutes / 60;
    subtotal = Math.round(pricePerHour * hours);
  }

  const commission = Math.round(subtotal * commissionRate);
  const total_amount = subtotal; // User pays full amount
  const venue_payout = subtotal - commission;

  return {
    subtotal,
    commission,
    total_amount,
    venue_payout,
    duration_minutes: durationMinutes,
  };
}

/**
 * Parse time string to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate duration in minutes between two time strings
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return endMinutes - startMinutes;
}

/**
 * Check if a time slot overlaps with existing bookings
 */
export function isSlotAvailable(
  startTime: string,
  endTime: string,
  existingBookings: Array<{ start_time: string; end_time: string }>
): boolean {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  for (const booking of existingBookings) {
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);

    // Check for overlap
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false;
    }
  }

  return true;
}

/**
 * Generate time slots for a court on a specific day
 */
export function generateTimeSlots(
  courtId: string,
  pricePerHour: number,
  openTime: string,
  closeTime: string,
  existingBookings: Array<{ start_time: string; end_time: string }>,
  slotDurationMinutes: number = 60
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  let currentMinutes = openMinutes;
  let slotId = 1;

  while (currentMinutes + slotDurationMinutes <= closeMinutes) {
    const startTime = minutesToTime(currentMinutes);
    const endTime = minutesToTime(currentMinutes + slotDurationMinutes);

    const is_available = isSlotAvailable(startTime, endTime, existingBookings);
    const price = Math.round((pricePerHour * slotDurationMinutes) / 60);

    slots.push({
      id: `${courtId}-${slotId++}`,
      court_id: courtId,
      start_time: startTime,
      end_time: endTime,
      is_available,
      price,
    });

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

/**
 * Validate booking request
 */
export function validateBookingRequest(
  request: CreateBookingRequest,
  bookingDate: Date
): { valid: boolean; error?: string } {
  const now = new Date();

  // Check if booking date is in the past
  if (bookingDate < now) {
    return { valid: false, error: 'Cannot book for past dates' };
  }

  // Check minimum hours ahead
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilBooking < MIN_BOOKING_HOURS_AHEAD) {
    return { valid: false, error: `Bookings must be made at least ${MIN_BOOKING_HOURS_AHEAD} hours in advance` };
  }

  // Check maximum days ahead
  const daysUntilBooking = hoursUntilBooking / 24;
  if (daysUntilBooking > MAX_BOOKING_DAYS_AHEAD) {
    return { valid: false, error: `Bookings can only be made up to ${MAX_BOOKING_DAYS_AHEAD} days in advance` };
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(request.start_time) || !timeRegex.test(request.end_time)) {
    return { valid: false, error: 'Invalid time format. Use HH:MM format' };
  }

  // Check start time is before end time
  if (timeToMinutes(request.start_time) >= timeToMinutes(request.end_time)) {
    return { valid: false, error: 'Start time must be before end time' };
  }

  // Check minimum duration (30 minutes)
  const duration = calculateDuration(request.start_time, request.end_time);
  if (duration < 30) {
    return { valid: false, error: 'Minimum booking duration is 30 minutes' };
  }

  // Check maximum duration (4 hours)
  if (duration > 240) {
    return { valid: false, error: 'Maximum booking duration is 4 hours' };
  }

  return { valid: true };
}

/**
 * Calculate refund amount based on cancellation time
 */
export function calculateRefund(
  totalAmount: number,
  bookingDate: Date,
  startTime: string
): { refundAmount: number; refundPercentage: number } {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  const bookingDateTime = new Date(bookingDate);
  bookingDateTime.setHours(hours, minutes, 0, 0);

  const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking >= FREE_CANCELLATION_HOURS) {
    // Full refund
    return { refundAmount: totalAmount, refundPercentage: 100 };
  } else if (hoursUntilBooking >= PARTIAL_REFUND_HOURS) {
    // Partial refund
    const refundAmount = Math.round(totalAmount * PARTIAL_REFUND_RATE);
    return { refundAmount, refundPercentage: PARTIAL_REFUND_RATE * 100 };
  } else {
    // No refund
    return { refundAmount: 0, refundPercentage: 0 };
  }
}

/**
 * Get day of week from date (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Format price in JPY
 */
export function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * Check if venue is open on a specific day
 */
export function isVenueOpen(
  operatingHours: Array<{ day_of_week: number; is_closed: boolean }>,
  date: Date
): boolean {
  const dayOfWeek = getDayOfWeek(date);
  const hours = operatingHours.find(h => h.day_of_week === dayOfWeek);
  return hours ? !hours.is_closed : false;
}

/**
 * Get operating hours for a specific day
 */
export function getOperatingHoursForDay(
  operatingHours: Array<{ day_of_week: number; open_time: string; close_time: string; is_closed: boolean }>,
  date: Date
): { open_time: string; close_time: string } | null {
  const dayOfWeek = getDayOfWeek(date);
  const hours = operatingHours.find(h => h.day_of_week === dayOfWeek);

  if (!hours || hours.is_closed) {
    return null;
  }

  return {
    open_time: hours.open_time,
    close_time: hours.close_time,
  };
}
