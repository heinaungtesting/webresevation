'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName: string;
  onUploadComplete: (avatarUrl: string) => void;
  onDelete?: () => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onUploadComplete,
  onDelete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be less than 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      onUploadComplete(data.avatar_url);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl || !onDelete) return;

    setDeleting(true);
    setError('');
    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete avatar');
      }

      onDelete();
    } catch (err: any) {
      console.error('Error deleting avatar:', err);
      setError(err.message || 'Failed to delete avatar');
    } finally {
      setDeleting(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={displayName}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized={displayUrl.startsWith('data:') || displayUrl.includes('dicebear')}
            />
          ) : (
            <span className="text-4xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Loading Overlay */}
          {(uploading || deleting) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Camera Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Actions */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">
          JPEG, PNG, WebP, or GIF. Max 5MB.
        </p>

        {currentAvatarUrl && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Remove Photo
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
