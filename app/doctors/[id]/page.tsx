import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Star, MapPin, Clock, GraduationCap, Calendar } from "lucide-react";

interface DoctorProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DoctorProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  // TODO: Fetch provider name from Supabase
  return {
    title: `Doctor Profile — ${id}`,
    description: "View doctor profile, qualifications, reviews, and book an appointment.",
  };
}

export default async function DoctorProfilePage({ params }: DoctorProfilePageProps) {
  const { id } = await params;

  // TODO: Fetch provider data from Supabase

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — Profile info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile header */}
            <div className="flex gap-6 rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                D
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Doctor Name</h1>
                <p className="text-blue-600">Specialty Placeholder</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> 4.8 (127 reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Cairo, Egypt
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" /> 15 yrs experience
                  </span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Doctor bio placeholder. This section will contain the doctor&apos;s background,
                education, languages spoken, and areas of expertise.
              </p>
            </div>

            {/* Reviews */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Patient Reviews</h2>
              <div className="mt-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <span className="text-sm font-medium">Patient {i + 1}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3 w-3 ${j < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Review placeholder text...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — Booking CTA */}
          <div>
            <div className="sticky top-24 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Book Appointment</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Consultation Fee</span>
                  <span className="font-semibold text-blue-600">EGP 350</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-4 w-4" /> 30 min
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Next Available</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <Calendar className="h-4 w-4" /> Tomorrow
                  </span>
                </div>
              </div>
              <Link
                href={`/doctors/${id}/book`}
                className="mt-4 block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
