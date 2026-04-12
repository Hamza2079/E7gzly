import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { updateDoctorProfile } from "./actions"
import { User, Stethoscope } from "lucide-react"

export const metadata = {
  title: "Profile Settings",
}

export default async function DoctorProfilePage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: userProfile }, { data: providerProfile }] = await Promise.all([
    (supabase as any).from("users").select("*").eq("id", user.id).single(),
    (supabase as any).from("providers").select("*").eq("user_id", user.id).single()
  ])

  if (!userProfile) redirect("/login")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-500">Manage your public information and clinic details.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <form action={updateDoctorProfile} className="p-8 space-y-8">
          
          {/* Section 1: Personal Info */}
          <div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={userProfile.full_name}
                  required
                  className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address (Read Only)</label>
                <input
                  type="email"
                  defaultValue={userProfile.email}
                  disabled
                  className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={userProfile.phone || ""}
                  className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  defaultValue={userProfile.gender || ""}
                  className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Professional Info */}
          <div className="pt-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Professional Details</h2>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  defaultValue={providerProfile?.license_number || ""}
                  required
                  className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio / Description</label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={providerProfile?.bio || ""}
                  className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    defaultValue={providerProfile?.years_of_experience || 0}
                    className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Consultation Fee (EGP)</label>
                  <input
                    type="number"
                    name="consultationFee"
                    defaultValue={providerProfile?.consultation_fee || 0}
                    className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Clinic / Hospital Name</label>
                  <input
                    type="text"
                    name="clinicName"
                    defaultValue={providerProfile?.clinic_name || ""}
                    className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Clinic Address</label>
                  <input
                    type="text"
                    name="clinicAddress"
                    defaultValue={providerProfile?.clinic_address || ""}
                    className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
