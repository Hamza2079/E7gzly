import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import { Search, MapPin, Activity, ShieldCheck, Heart, User, Clock, Bell, LineChart, FileText, Users, PlayCircle, Quote, ArrowRight } from "lucide-react"
import Navbar from "@/components/queue/Navbar"

export default async function LandingPage() {
  const supabase = await createServer()

  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  if (user) {
    const { data: profile } = await (supabase as any).from("users").select("role").eq("id", user.id).single()
    role = profile?.role
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 md:pt-24 md:pb-32 lg:flex lg:items-center lg:gap-12">
        <div className="text-center lg:text-right lg:w-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            تحديثات الطابور مباشرة
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.1]">
            وداعاً لزحمة<br />غرف <span className="text-blue-600">الانتظار</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-base md:text-lg leading-relaxed text-gray-500 font-medium">
            انضم لطابور عيادتك عن بُعد واحصل على تنبيهات حية لدورك. احجز وقتك بدلاً من إهداره في الانتظار.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            {role !== "provider" && (
              <Link
                href="/doctors"
                className="w-full sm:w-auto rounded-2xl bg-blue-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
              >
                ابحث عن طبيب
              </Link>
            )}
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-50 text-blue-600 px-10 py-4 text-sm font-bold transition hover:bg-blue-100"
            >
               <PlayCircle className="h-4 w-4" /> كيف يعمل؟
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 relative rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Patient" className="object-cover" />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-400">يثق بنا أكثر من <span className="text-blue-600">10,000</span> مريض يومياً</p>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-16 lg:mt-0 lg:w-1/2 flex justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/30 blur-3xl rounded-full z-0 pointer-events-none" />
          
          {/* Phone Mockup Frame */}
          <div className="relative z-10 w-full max-w-[300px] rounded-[3rem] border-[10px] border-gray-900 bg-white ring-1 ring-gray-900/10 shadow-2xl overflow-hidden aspect-[1/2.05]">
            <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-1/3 mx-auto z-50 pointer-events-none" />
            
            {/* Phone Screen UI */}
            <div className="h-full w-full bg-gray-50 flex flex-col">
               <div className="bg-blue-600 p-6 pt-12 pb-16 text-white text-center">
                 <p className="text-[10px] font-bold text-blue-200 tracking-widest uppercase">تذكرة الحجز</p>
                 <h3 className="text-lg font-bold mt-1">د. سارة أحمد</h3>
                 <div className="mt-6 mx-auto bg-white text-blue-600 rounded-2xl py-4 shadow-lg w-4/5">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">رقمك في الطابور</p>
                   <p className="text-4xl font-black tracking-tighter mt-1" dir="ltr">#04</p>
                 </div>
               </div>
               
               <div className="flex-1 bg-white -mt-6 rounded-t-3xl p-6 relative">
                 <div className="flex justify-between items-center py-4 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-400">الانتظار المتوقع</p>
                    <p className="text-sm font-black text-gray-900">12 دقيقة</p>
                 </div>
                 <div className="flex justify-between items-center py-4 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-400">حالة العيادة</p>
                    <p className="text-sm font-bold text-green-600">منتظم ✅</p>
                 </div>
                 <button className="mt-8 w-full bg-blue-600 text-white rounded-xl py-3.5 text-xs font-bold shadow-lg shadow-blue-600/20 transition">
                    تحديث الحالة
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-24 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">رحلة مريض.. أسهل وأسرع</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-medium">ثلاث خطوات بسيطة لاستعادة وقتك من دكة الانتظار.</p>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Search, title: "ابحث وانضم", desc: "ابحث عن عيادتك المفضلة وانضم للطابور الافتراضي بلمسة واحدة." },
              { icon: Activity, title: "تابع دورك", desc: "احصل على تحديثات مباشرة لمكانك في الطابور ووقت الانتظار المتوقع." },
              { icon: MapPin, title: "احضر وقابل", desc: "سنرسل لك تنبيهاً عندما يقترب دورك. ادخل العيادة وقابل طبيبك فوراً." }
            ].map((step, i) => (
              <div key={i} className="group rounded-[2.5rem] bg-white p-8 sm:p-10 text-right shadow-sm ring-1 ring-gray-100 transition hover:shadow-xl hover:-translate-y-1 duration-300">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-8 transition-transform group-hover:scale-110">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Section Features */}
      <section className="py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-24">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl leading-tight">
              نخبة من الأطباء<br />في مختلف التخصصات
            </h2>
            <div className="mt-10 space-y-4 relative">
              {/* Fake Doctor Card 1 */}
              <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm w-full max-w-md backdrop-blur-sm z-10 relative">
                 <div className="flex items-center gap-4">
                   <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop" className="h-14 w-14 rounded-2xl object-cover shadow-sm" alt="Doctor" />
                   <div>
                     <p className="text-sm font-black text-gray-900">د. مايكل شين</p>
                     <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">أخصائي القلب</p>
                     <p className="text-[10px] text-gray-400 font-bold">2 مرضى متبقين</p>
                   </div>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                   <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                 </div>
              </div>
              
              {/* Fake Doctor Card 2 */}
              <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm w-full max-w-md opacity-60 scale-[0.96] origin-right -mt-2 z-0">
                 <div className="flex items-center gap-4">
                   <img src="https://images.unsplash.com/photo-1594824436998-d40d995c255c?w=150&h=150&fit=crop" className="h-14 w-14 rounded-2xl object-cover" alt="Doctor" />
                   <div>
                     <p className="text-sm font-black text-gray-900">د. إلينا رودريجيز</p>
                     <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">طبيبة أطفال</p>
                     <p className="text-[10px] text-gray-400 font-bold">الطابور متوقف حالياً</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 lg:mt-0 lg:w-1/2">
             <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/3]">
               <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000" alt="Clinic Interior" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent flex flex-col justify-end p-8">
                 <h3 className="text-white font-black text-2xl">مرافق رعاية حديثة</h3>
                 <p className="text-blue-100 text-sm mt-2 font-medium">تواصل مع أفضل العيادات في منطقتك بكل سهولة.</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Grid of Micro Features */}
      <section className="border-t border-gray-50 py-24 bg-white">
         <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Bell, title: "تنبيهات ذكية", desc: "استلم رسائل نصية أو تنبيهات فور اقتراب دورك في الطابور." },
                { icon: LineChart, title: "تحليلات فورية", desc: "شاهد متوسط وقت الانتظار في العيادة لتختار الوقت الأنسب لك." },
                { icon: FileText, title: "سجلات رقمية", desc: "احتفظ بكافة زياراتك وبيانات الاستشارات في مكان واحد آمن." },
                { icon: Users, title: "حسابات العائلة", desc: "إدارة طوابير أطفالك وأفراد عائلتك من حساب واحد وبكل سهولة." }
              ].map((feat, i) => (
                <div key={i} className="flex flex-col items-center text-center lg:items-start lg:text-right">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">{feat.title}</h4>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 bg-gray-50/30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col md:flex-row">
            <div className="p-10 md:p-16 md:w-3/5 flex flex-col justify-center">
               <Quote className="h-12 w-12 text-blue-600 mb-8 opacity-20" />
               <p className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed italic">
                 "إحجزلي غير طريقتي في زيارة الطبيب. لم أعد أضيع الساعات في غرف الانتظار المزدحمة. أحصل على قهوتي المفضل وأدخل العيادة في الوقت المحدد تماماً."
               </p>
               <div className="mt-10 flex items-center gap-4">
                 <img src="https://i.pravatar.cc/150?img=32" className="h-12 w-12 rounded-2xl shadow-sm" alt="User" />
                 <div>
                   <p className="font-black text-gray-900 text-sm">سارة علي</p>
                   <p className="text-xs text-gray-400 font-bold">مريضة مسجلة منذ 2024</p>
                 </div>
               </div>
            </div>
            <div className="md:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-800 relative min-h-[300px]">
               <div className="absolute inset-0 flex items-center justify-center opacity-20">
                 <Activity className="h-48 w-48 text-white" />
               </div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 pb-40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-[3.5rem] bg-gray-900 p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-48 bg-blue-600 blur-[120px] rounded-full opacity-30" />
            <h2 className="relative z-10 text-3xl font-black text-white sm:text-5xl text-balance leading-tight">
              جاهز للتوقف عن الانتظار؟
            </h2>
            <p className="relative z-10 mt-6 text-gray-400 max-w-2xl mx-auto text-lg font-medium">
              انضم لآلاف المرضى الذين يستخدمون إحجزلي لتوفير وقتهم والحصول على رعاية طبية أفضل.
            </p>
            <div className="relative z-10 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-2xl bg-white text-gray-900 px-10 py-4 text-sm font-bold shadow-xl transition hover:bg-gray-100"
              >
                أنشئ حساباً مجانياً
              </Link>
              <Link
                href="/doctors"
                className="w-full sm:w-auto rounded-2xl bg-blue-600 text-white px-10 py-4 text-sm font-bold shadow-xl transition hover:bg-blue-700"
              >
                ابحث عن طبيب
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-6">
           <div className="grid gap-16 md:grid-cols-4">
              <div className="md:col-span-2">
                <Link href="/" className="text-3xl font-black text-blue-600 block mb-6 tracking-tighter">
                  إحجزلي
                </Link>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                  نظام ذكي لإدارة طوابير العيادات الطبية، يربط بين الأطباء والمرضى لتوفير الوقت والجهد.
                </p>
              </div>
              
              <div>
                <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-widest">المنتج</h4>
                <ul className="space-y-4 text-sm text-gray-500 font-bold">
                  <li><Link href="/doctors" className="hover:text-blue-600 transition-colors">ابحث عن طبيب</Link></li>
                  <li><Link href="/login" className="hover:text-blue-600 transition-colors">دخول المرضى</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-blue-600 transition-colors">كيف يعمل</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-widest">مقدمي الخدمة</h4>
                <ul className="space-y-4 text-sm text-gray-500 font-bold">
                  <li><Link href="/login" className="hover:text-blue-600 transition-colors">بوابة العيادات</Link></li>
                  <li><Link href="/register" className="hover:text-blue-600 transition-colors">انضم إلينا</Link></li>
                  <li><Link href="/support" className="hover:text-blue-600 transition-colors">مركز الدعم</Link></li>
                </ul>
              </div>
           </div>
           
           <div className="mt-20 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
             <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">© 2026 إحجزلي للأنظمة الطبية. جميع الحقوق محفوظة.</p>
             <div className="flex gap-6">
                <div className="h-5 w-5 rounded bg-gray-100"></div>
                <div className="h-5 w-5 rounded bg-gray-100"></div>
                <div className="h-5 w-5 rounded bg-gray-100"></div>
             </div>
           </div>
        </div>
      </footer>
    </div>
  )
}
