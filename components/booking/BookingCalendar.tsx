"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  availableDates?: string[]; // ISO date strings
}

export default function BookingCalendar({
  onDateSelect,
  selectedDate,
  availableDates = [],
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // If no availableDates provided, all future dates are available
    if (availableDates.length === 0) return !isBefore(date, startOfDay(new Date()));
    return availableDates.includes(dateStr);
  };

  const isSelected = (date: Date) => {
    return selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };

  return (
    <div className="w-full rounded-xl border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={goToNextMonth}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {days.map((day) => {
          const available = isDateAvailable(day);
          const selected = isSelected(day);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => available && onDateSelect(day)}
              disabled={!available}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg text-sm transition-colors",
                available && !selected && "hover:bg-blue-50 hover:text-blue-700",
                selected && "bg-blue-600 text-white",
                !available && "cursor-not-allowed text-gray-300",
                today && !selected && "font-bold text-blue-600",
                !isSameMonth(day, currentMonth) && "text-gray-300"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
