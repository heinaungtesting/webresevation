import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Get old avatar URL before updating
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar_url: true },
    });

    // Update database FIRST to prevent orphan file issue
    // If this fails, we can safely delete the new file
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatar_url: avatarUrl },
        select: {
          id: true,
          avatar_url: true,
        },
      });

      // Only delete old avatar AFTER successful database update
      if (existingUser?.avatar_url) {
        const oldPath = existingUser.avatar_url.split('/avatars/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${oldPath}`])
            .catch((err) => console.error('Failed to delete old avatar:', err));
        }
      }

      return NextResponse.json({
        avatar_url: updatedUser.avatar_url,
        message: 'Avatar uploaded successfully',
      });
    } catch (dbError) {
      // Database update failed - clean up the newly uploaded file
      console.error('Database update failed:', dbError);
      await supabase.storage
        .from('avatars')
        .remove([filePath])
        .catch((err) => console.error('Failed to cleanup new avatar:', err));

      return NextResponse.json(
        { error: 'Failed to update avatar in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current avatar
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar_url: true },
    });

    if (existingUser?.avatar_url) {
      // Extract file path from URL
      const filePath = existingUser.avatar_url.split('/avatars/').pop();
      if (filePath) {
        await supabase.storage
          .from('avatars')
          .remove([`avatars/${filePath}`])
          .catch((err) => console.error('Failed to delete avatar:', err));
      }
    }

    // Remove avatar_url from database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: null },
    });

    return NextResponse.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
