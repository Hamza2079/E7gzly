"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/types";
import { formatTime } from "@/utils/formatDate";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot?: string;
  onSelect: (startTime: string) => void;
}

export default function TimeSlotGrid({ slots, selectedSlot, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-gray-50 py-12 text-center">
        <Clock className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">No available slots for this date.</p>
        <p className="text-xs text-gray-400">Please select a different date.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.start;
        return (
          <button
            key={slot.start}
            onClick={() => slot.isAvailable && onSelect(slot.start)}
            disabled={!slot.isAvailable}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
              slot.isAvailable &&
                !isSelected &&
                "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50",
              isSelected && "border-blue-600 bg-blue-600 text-white shadow-sm",
              !slot.isAvailable && "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through"
            )}
          >
            {formatTime(slot.start)}
          </button>
        );
      })}
    </div>
  );
}
