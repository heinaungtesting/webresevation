import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/sport-centers/[id] - Update a sport center (admin)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Require admin access
    await requireAdmin(user?.id);

    const { id } = await params;
    const body = await request.json();

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (body.name_en !== undefined) updateData.name_en = body.name_en;
    if (body.name_ja !== undefined) updateData.name_ja = body.name_ja;
    if (body.address_en !== undefined) updateData.address_en = body.address_en;
    if (body.address_ja !== undefined) updateData.address_ja = body.address_ja;
    if (body.station_en !== undefined) updateData.station_en = body.station_en || null;
    if (body.station_ja !== undefined) updateData.station_ja = body.station_ja || null;
    if (body.latitude !== undefined)
      updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    if (body.longitude !== undefined)
      updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;

    const sportCenter = await prisma.sportCenter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(sportCenter);
  } catch (error: any) {
    console.error('Error updating sport center:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Sport center not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update sport center' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sport-centers/[id] - Delete a sport center (admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Require admin access
    await requireAdmin(user?.id);

    const { id } = await params;

    // Check if sport center has any sessions
    const sessionCount = await prisma.session.count({
      where: { sport_center_id: id },
    });

    if (sessionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete sport center with ${sessionCount} existing session(s)` },
        { status: 400 }
      );
    }

    await prisma.sportCenter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Sport center deleted' });
  } catch (error: any) {
    console.error('Error deleting sport center:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Sport center not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete sport center' },
      { status: 500 }
    );
  }
}
