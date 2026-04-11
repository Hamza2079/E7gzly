import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import { Users, Clock, Shield, Stethoscope, ArrowRight, Zap } from "lucide-react"
import Navbar from "@/components/queue/Navbar"

export default async function LandingPage() {
  const supabase = await createServer()

  const { count: doctorCount } = await supabase
    .from("providers")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-blue-100 backdrop-blur-sm">
            <Zap className="h-4 w-4" />
            No more waiting in crowded clinics
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Skip the Wait.<br />
            <span className="text-blue-200">Join the Queue Online.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            E7gzly lets you join a clinic queue from anywhere. Track your position in real-time,
            get notified when it&apos;s your turn, and arrive just in time.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/doctors"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
            >
              Find a Doctor <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-gray-500">
            Join a queue in 3 steps — no phone calls, no waiting rooms.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Stethoscope className="h-8 w-8 text-blue-600" />,
                title: "Choose a Doctor",
                desc: "Browse verified doctors by specialty. See live queue status before joining.",
              },
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: "Join the Queue",
                desc: "Get your queue number instantly. Track your position and estimated wait in real-time.",
              },
              {
                icon: <Clock className="h-8 w-8 text-blue-600" />,
                title: "Arrive On Time",
                desc: "We'll notify you when to head to the clinic — no unnecessary waiting.",
              },
            ].map((step, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  {step.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { icon: <Stethoscope className="h-6 w-6" />, value: doctorCount || 0, label: "Verified Doctors" },
            { icon: <Users className="h-6 w-6" />, value: "100%", label: "Real-time Tracking" },
            { icon: <Clock className="h-6 w-6" />, value: "0", label: "Minutes Wasted" },
            { icon: <Shield className="h-6 w-6" />, value: "24/7", label: "Queue Access" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to Skip the Wait?</h2>
          <p className="mt-4 text-gray-500">
            Join thousands of patients who use E7gzly to save time at the clinic.
          </p>
          <Link
            href="/doctors"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            Browse Doctors <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} E7gzly. All rights reserved.
      </footer>
    </>
  )
}
