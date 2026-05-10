"use client"

import { useState, useEffect } from "react"
import GoogleLoginButton from "@/components/auth/GoogleLoginButton"
import { signUpWithCredentials } from "@/app/(auth)/actions"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [role, setRole] = useState("patient")
  const [specialties, setSpecialties] = useState<{ id: string; name: string; name_ar: string | null }[]>([])
  const [services, setServices] = useState<{name: string, price: string}[]>([{name: "", price: ""}])

  const addService = () => setServices([...services, {name: "", price: ""}])
  const updateService = (index: number, field: "name"|"price", val: string) => {
    const newServices = [...services]
    newServices[index][field] = val
    setServices(newServices)
  }
  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    }
  }
  useEffect(() => {
    async function fetchSpecialties() {
      const supabase = createClient()
      const { data } = await supabase.from("specialties").select("id, name, name_ar")
      if (data) setSpecialties(data)
    }
    fetchSpecialties()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            إحجزلي
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-gray-500">ابدأ في حجز مواعيدك بكل سهولة</p>
        </div>

        <form action={signUpWithCredentials} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              الاسم الكامل *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="أحمد حسن"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
              البريد الإلكتروني *
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              رقم الهاتف
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+201234567890"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                النوع *
              </label>
              <select
                id="gender"
                name="gender"
                className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">اختر</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                تاريخ الميلاد *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
              كلمة المرور *
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">أنا أسجل كـ</label>
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
                🏥 مريض
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
                🩺 طبيب
              </button>
            </div>
          </div>

          {/* Patient-specific fields (Medical History) */}
          {role === "patient" && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-semibold text-gray-900">التاريخ الطبي (اختياري)</p>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">فصيلة الدم</label>
                  <select id="bloodType" name="bloodType" className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left" dir="ltr">
                    <option value="">غير معروف</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">حساسية من أدوية أو أطعمة</label>
                  <input id="allergies" name="allergies" type="text" placeholder="مثال: البنسلين" className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label htmlFor="chronicDiseases" className="block text-sm font-medium text-gray-700">أمراض مزمنة (إن وجدت)</label>
                <input id="chronicDiseases" name="chronicDiseases" type="text" placeholder="مثال: السكري، ضغط الدم" className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              
              <div>
                <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700">الأدوية الحالية</label>
                <textarea id="currentMedications" name="currentMedications" rows={2} placeholder="الأدوية التي تتناولها بانتظام" className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
              </div>
            </div>
          )}

          {/* Doctor-specific fields */}
          {role === "provider" && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-semibold text-gray-900">المعلومات المهنية</p>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  رقم الترخيص الطبي *
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  placeholder="e.g. EG-12345"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label htmlFor="specialtyId" className="block text-sm font-medium text-gray-700">
                  التخصص *
                </label>
                <select
                  id="specialtyId"
                  name="specialtyId"
                  className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر التخصص</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_ar || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  نبذة / المؤهلات *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  placeholder="خبراتك، تعليمك، تخصصاتك الدقيقة..."
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                  سنوات الخبرة
                </label>
                <input id="yearsOfExperience" name="yearsOfExperience" type="number" min="0" placeholder="5"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              {/* Dynamic Services */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">الخدمات وأسعارها *</label>
                  <button type="button" onClick={addService} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-blue-100">
                    + إضافة خدمة
                  </button>
                </div>
                <input type="hidden" name="services" value={JSON.stringify(services)} />
                <div className="space-y-3">
                  {services.map((srv, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input 
                        type="text" 
                        value={srv.name}
                        onChange={(e) => updateService(idx, "name", e.target.value)}
                        placeholder="اسم الخدمة (كشف، استشارة...)" 
                        className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        required
                      />
                      <div className="relative w-28">
                        <input 
                          type="number" 
                          value={srv.price}
                          onChange={(e) => updateService(idx, "price", e.target.value)}
                          placeholder="السعر" 
                          min="0"
                          className="w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none text-left"
                          dir="ltr"
                          required
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-400">ر.س</span>
                      </div>
                      {services.length > 1 && (
                        <button type="button" onClick={() => removeService(idx)} className="mt-1 text-red-500 hover:text-red-700 p-1">
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">اسم العيادة</label>
                <input id="clinicName" name="clinicName" type="text" placeholder="عيادة الشفاء"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700">عنوان العيادة</label>
                <input id="clinicAddress" name="clinicAddress" type="text" placeholder="شارع 9، المعادي"
                  className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">المدينة *</label>
                <select id="city" name="city" required
                  className="mt-1 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">اختر المدينة</option>
                  <option value="Cairo">القاهرة</option>
                  <option value="Alexandria">الإسكندرية</option>
                  <option value="Giza">الجيزة</option>
                  <option value="Mansoura">المنصورة</option>
                  <option value="Tanta">طنطا</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {role === "provider" ? "تقديم طلب التسجيل" : "إنشاء الحساب"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">أو أكمل باستخدام</span>
          </div>
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-gray-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
