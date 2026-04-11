"use client"

import { useState, useEffect } from "react"
import GoogleLoginButton from "@/components/auth/GoogleLoginButton"
import { signUpWithCredentials } from "@/app/(auth)/actions"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [role, setRole] = useState("patient")
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchSpecialties() {
      const supabase = createClient()
      const { data } = await supabase.from("specialties").select("id, name")
      if (data) setSpecialties(data)
    }
    fetchSpecialties()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            E7gzly
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start booking appointments today</p>
        </div>

        <form action={signUpWithCredentials} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Ahmed Hassan"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+201234567890"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">I am a</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  role === "patient"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                🏥 Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("provider")}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  role === "provider"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                🩺 Doctor
              </button>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {role === "provider" && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-semibold text-gray-900">Professional Information</p>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  Medical License Number *
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  placeholder="e.g. EG-12345"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="specialtyId" className="block text-sm font-medium text-gray-700">
                  Specialty *
                </label>
                <select
                  id="specialtyId"
                  name="specialtyId"
                  className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a specialty</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio / Qualifications *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  placeholder="Your experience, education, specializations..."
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                    Years Experience
                  </label>
                  <input id="yearsOfExperience" name="yearsOfExperience" type="number" min="0" placeholder="5"
                    className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700">
                    Fee (EGP)
                  </label>
                  <input id="consultationFee" name="consultationFee" type="number" min="0" placeholder="350"
                    className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">Clinic Name</label>
                <input id="clinicName" name="clinicName" type="text" placeholder="Cairo Medical Center"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700">Clinic Address</label>
                <input id="clinicAddress" name="clinicAddress" type="text" placeholder="123 Main St, Maadi"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City *</label>
                <select id="city" name="city" required
                  className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select city</option>
                  <option value="Cairo">Cairo</option>
                  <option value="Alexandria">Alexandria</option>
                  <option value="Giza">Giza</option>
                  <option value="Mansoura">Mansoura</option>
                  <option value="Tanta">Tanta</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {role === "provider" ? "Submit Application" : "Create Account"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
