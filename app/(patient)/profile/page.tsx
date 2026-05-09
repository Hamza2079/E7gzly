import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { updatePatientProfile, updateAvatarUrl } from "./actions"
import { UserCircle, Activity, FileText } from "lucide-react"
import AvatarUpload from "@/components/profile/AvatarUpload"

export const metadata = {
  title: "Profile Settings",
}

export default async function ProfilePage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await (supabase as any)
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <AvatarUpload 
            userId={user.id} 
            currentAvatarUrl={profile?.avatar_url} 
            onUploadComplete={async (url) => {
              "use server"
              await updateAvatarUrl(url)
            }} 
          />
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
             <UserCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-black text-gray-900">إعدادات الحساب</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">إدارة معلوماتك الشخصية والطبية</p>
        </div>
      </div>

      <form action={updatePatientProfile} className="space-y-8" dir="rtl">
        {/* Personal Info Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCircle className="h-5 w-5" />
            </div>
            المعلومات الشخصية
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">الاسم بالكامل</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                defaultValue={profile?.full_name || ""}
                required
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">البريد الإلكتروني <span className="text-[8px] font-bold text-blue-400">(للقراءة فقط)</span></label>
              <input
                type="email"
                id="email"
                defaultValue={profile?.email || ""}
                disabled
                className="block w-full rounded-2xl border border-gray-100 bg-gray-100 px-5 py-3.5 text-sm font-bold text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">رقم الهاتف</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                defaultValue={profile?.phone || ""}
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all"
                dir="ltr"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">الجنس</label>
              <select
                id="gender"
                name="gender"
                defaultValue={profile?.gender || ""}
                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              >
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dateOfBirth" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">تاريخ الميلاد</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                defaultValue={profile?.date_of_birth || ""}
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Medical History Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            السجل الطبي
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="bloodType" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">فصيلة الدم</label>
              <select
                id="bloodType"
                name="bloodType"
                defaultValue={profile?.blood_type || ""}
                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                dir="ltr"
              >
                <option value="">غير محدد</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label htmlFor="chronicDiseases" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">الأمراض المزمنة</label>
              <input
                type="text"
                id="chronicDiseases"
                name="chronicDiseases"
                defaultValue={profile?.chronic_diseases || ""}
                placeholder="سكري، ضغط..."
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="allergies" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">الحساسية</label>
              <input
                type="text"
                id="allergies"
                name="allergies"
                defaultValue={profile?.allergies || ""}
                placeholder="بنسيلين، أطعمة..."
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="currentMedications" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 mr-2">الأدوية الحالية</label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                defaultValue={profile?.current_medications || ""}
                placeholder="أذكر أي أدوية تتناولها بانتظام..."
                rows={3}
                className="block w-full rounded-2xl border border-gray-100 px-5 py-3.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 bg-gray-50 focus:bg-white transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-20">
          <button
            type="submit"
            className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black text-base shadow-xl shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            حفظ جميع التغييرات
          </button>
          <button
             type="reset"
             className="h-14 px-8 rounded-2xl border border-gray-200 text-gray-400 font-bold hover:bg-gray-50 transition-all"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
