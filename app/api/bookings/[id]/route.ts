// Booking Detail API - Get, cancel booking
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { calculateRefund } from '@/lib/venue-booking';

export const dynamic = 'force-dynamic';

// GET - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const booking = await prisma.courtBooking.findUnique({
      where: { id },
      include: {
        court: {
          include: {
            sport_center: {
              select: {
                id: true,
                name_en: true,
                name_ja: true,
                address_en: true,
                address_ja: true,
                phone: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            sport_type: true,
            skill_level: true,
            date_time: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate potential refund if cancelled
    const refundInfo = calculateRefund(
      booking.total_amount,
      booking.booking_date,
      booking.start_time
    );

    return NextResponse.json({
      id: booking.id,
      court_id: booking.court_id,
      user_id: booking.user_id,
      session_id: booking.session_id,
      booking_date: booking.booking_date.toISOString().split('T')[0],
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_minutes: booking.duration_minutes,
      subtotal: booking.subtotal,
      commission: booking.commission,
      total_amount: booking.total_amount,
      venue_payout: booking.venue_payout,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_intent_id: booking.payment_intent_id,
      paid_at: booking.paid_at?.toISOString(),
      cancelled_at: booking.cancelled_at?.toISOString(),
      cancellation_reason: booking.cancellation_reason,
      refund_amount: booking.refund_amount,
      user_notes: booking.user_notes,
      venue_notes: booking.venue_notes,
      created_at: booking.created_at.toISOString(),
      updated_at: booking.updated_at.toISOString(),
      court: {
        id: booking.court.id,
        name_en: booking.court.name_en,
        name_ja: booking.court.name_ja,
        sport_type: booking.court.sport_type,
        indoor: booking.court.indoor,
        has_equipment: booking.court.has_equipment,
      },
      venue: {
        id: booking.court.sport_center.id,
        name_en: booking.court.sport_center.name_en,
        name_ja: booking.court.sport_center.name_ja,
        address_en: booking.court.sport_center.address_en,
        address_ja: booking.court.sport_center.address_ja,
        phone: booking.court.sport_center.phone,
        latitude: booking.court.sport_center.latitude,
        longitude: booking.court.sport_center.longitude,
      },
      session: booking.session ? {
        id: booking.session.id,
        sport_type: booking.session.sport_type,
        skill_level: booking.session.skill_level,
        date_time: booking.session.date_time.toISOString(),
      } : null,
      cancellation_policy: {
        can_cancel: booking.status === 'PENDING' || booking.status === 'CONFIRMED',
        refund_amount: refundInfo.refundAmount,
        refund_percentage: refundInfo.refundPercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse cancellation reason from body
    let cancellationReason: string | undefined;
    try {
      const body = await request.json();
      cancellationReason = body.reason;
    } catch {
      // No body provided, that's okay
    }

    const booking = await prisma.courtBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'This booking cannot be cancelled' },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundInfo = calculateRefund(
      booking.total_amount,
      booking.booking_date,
      booking.start_time
    );

    // Update booking and commission transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.courtBooking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelled_at: new Date(),
          cancellation_reason: cancellationReason,
          refund_amount: refundInfo.refundAmount,
        },
      });

      // Update commission transaction if payment was made
      if (booking.payment_status === 'PAID') {
        await tx.commissionTransaction.update({
          where: { booking_id: id },
          data: {
            payout_status: 'REFUNDED',
          },
        });

        // Update booking payment status
        await tx.courtBooking.update({
          where: { id },
          data: {
            payment_status: refundInfo.refundAmount > 0 ? 'REFUNDED' : 'PAID',
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      id: updatedBooking.id,
      status: updatedBooking.status,
      cancelled_at: updatedBooking.cancelled_at?.toISOString(),
      cancellation_reason: updatedBooking.cancellation_reason,
      refund_amount: refundInfo.refundAmount,
      refund_percentage: refundInfo.refundPercentage,
      message: refundInfo.refundAmount > 0
        ? `Booking cancelled. Refund of ¥${refundInfo.refundAmount.toLocaleString()} (${refundInfo.refundPercentage}%) will be processed.`
        : 'Booking cancelled. No refund available due to late cancellation.',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
