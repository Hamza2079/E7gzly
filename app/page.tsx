import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Calendar, CheckCircle, Star, Users, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ===== Hero Section ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Book Your Doctor
              <br />
              <span className="text-blue-200">Appointment Online</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
              Find top-rated doctors, check real-time availability, and book appointments instantly. Healthcare made simple.
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by specialty or doctor name..."
                  className="w-full rounded-xl border-0 py-3 pl-11 pr-4 text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <Link
                href="/doctors"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50"
              >
                Find Doctors
              </Link>
            </div>
          </div>
        </section>

        {/* ===== How It Works ===== */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-gray-500">
            Book an appointment in 3 easy steps
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: <Search className="h-8 w-8" />, title: "Search", desc: "Find doctors by specialty, location, or name" },
              { icon: <Calendar className="h-8 w-8" />, title: "Book", desc: "Pick an available time slot that works for you" },
              { icon: <CheckCircle className="h-8 w-8" />, title: "Done", desc: "Get instant confirmation and appointment reminders" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl border bg-white p-8 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {step.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Stats ===== */}
        <section className="bg-blue-50 px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
            {[
              { icon: <Users className="h-6 w-6" />, value: "500+", label: "Verified Doctors" },
              { icon: <Star className="h-6 w-6" />, value: "50K+", label: "Happy Patients" },
              { icon: <Calendar className="h-6 w-6" />, value: "120K+", label: "Appointments Booked" },
              { icon: <Clock className="h-6 w-6" />, value: "24/7", label: "Online Booking" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-2 text-blue-600">{s.icon}</div>
                <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to Book Your Appointment?</h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-500">
            Join thousands of patients who trust E7gzly for their healthcare needs.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/doctors"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow transition-colors hover:bg-blue-700"
            >
              Browse Doctors
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
