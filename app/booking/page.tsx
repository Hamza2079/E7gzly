import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Select a date and time to book your appointment.",
};

export default function BookingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="mt-2 text-gray-500">
          Select a date and time slot to complete your booking.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Calendar */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Date</h2>
            {/* TODO: Replace with <BookingCalendar /> */}
            <div className="flex h-80 items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-400">
              [ BookingCalendar placeholder ]
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Times</h2>
            {/* TODO: Replace with <TimeSlotGrid /> */}
            <div className="flex h-80 items-center justify-center rounded-xl border bg-gray-50 text-sm text-gray-400">
              [ TimeSlotGrid placeholder ]
            </div>
          </div>
        </div>

        {/* Visit reason */}
        <div className="mt-8">
          <label htmlFor="visit-reason" className="block text-sm font-medium text-gray-700">
            Reason for visit (optional)
          </label>
          <textarea
            id="visit-reason"
            rows={3}
            placeholder="Briefly describe your symptoms or reason..."
            className="mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <button className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
            Confirm Booking
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
