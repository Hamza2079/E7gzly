"use client"

import { useState, useEffect } from "react"
import { completeProfile } from "./actions"
import { createClient } from "@/lib/supabase/client"

export default function CompleteProfilePage() {
  const [role, setRole] = useState<"patient" | "doctor" | null>(null)
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
      <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600">E7gzly</h1>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tell us a bit about yourself to get started
          </p>
        </div>

        {/* Step 1: Role selection */}
        {!role && (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-gray-700">I am a...</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole("patient")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="text-4xl">🏥</span>
                <span className="font-semibold text-gray-900">Patient</span>
                <span className="text-xs text-gray-500">Book appointments</span>
              </button>
              <button
                onClick={() => setRole("doctor")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="text-4xl">🩺</span>
                <span className="font-semibold text-gray-900">Doctor</span>
                <span className="text-xs text-gray-500">Accept appointments</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Profile form */}
        {role && (
          <form action={completeProfile} className="space-y-4">
            <input type="hidden" name="role" value={role} />

            {/* Back button */}
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Change role
            </button>

            {/* Common fields */}
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

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
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

            {/* Doctor-specific fields */}
            {role === "doctor" && (
              <>
                <hr className="my-4" />
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
                    placeholder="Tell patients about your experience, education, and specializations..."
                    className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                      Years of Experience
                    </label>
                    <input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      min="0"
                      placeholder="5"
                      className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700">
                      Consultation Fee (EGP)
                    </label>
                    <input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      min="0"
                      placeholder="350"
                      className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                    Clinic / Hospital Name
                  </label>
                  <input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    placeholder="Cairo Medical Center"
                    className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700">
                    Clinic Address
                  </label>
                  <input
                    id="clinicAddress"
                    name="clinicAddress"
                    type="text"
                    placeholder="123 Main St, Maadi"
                    className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select city</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="Giza">Giza</option>
                    <option value="Mansoura">Mansoura</option>
                    <option value="Tanta">Tanta</option>
                    <option value="Aswan">Aswan</option>
                    <option value="Luxor">Luxor</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {role === "doctor" ? "Submit for Review" : "Complete Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
