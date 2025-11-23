'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/app/components/ui/Button';
import type { TimeSlot } from '@/types/venue-booking';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot | null) => void;
  pricePerHour: number;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSlotSelect,
  pricePerHour,
}: TimeSlotGridProps) {
  const locale = useLocale();
  const isJa = locale === 'ja';

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const availableSlots = slots.filter(s => s.is_available);
  const unavailableSlots = slots.filter(s => !s.is_available);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isJa ? '利用可能な時間帯がありません' : 'No time slots available'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Available slots */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {isJa ? '予約可能' : 'Available'} ({availableSlots.length})
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            const isAvailable = slot.is_available;

            return (
              <button
                key={slot.id}
                onClick={() => {
                  if (isAvailable) {
                    onSlotSelect(isSelected ? null : slot);
                  }
                }}
                disabled={!isAvailable}
                className={`
                  p-3 rounded-lg border text-center transition-all
                  ${isAvailable
                    ? isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                  {slot.start_time}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {slot.end_time}
                </div>
                {isAvailable && (
                  <div className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {formatPrice(slot.price)}
                  </div>
                )}
                {!isAvailable && (
                  <div className="text-xs mt-1 text-red-400">
                    {isJa ? '予約済' : 'Booked'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white border border-gray-200"></div>
          <span>{isJa ? '予約可能' : 'Available'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 border-2 border-blue-500"></div>
          <span>{isJa ? '選択中' : 'Selected'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-100"></div>
          <span>{isJa ? '予約済み' : 'Booked'}</span>
        </div>
      </div>
    </div>
  );
}
