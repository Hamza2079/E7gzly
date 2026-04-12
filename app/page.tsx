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
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-32 lg:flex lg:items-center lg:gap-12">
        <div className="text-center lg:text-left lg:w-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE QUEUE REPORTING
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Skip the waiting<br />room <span className="text-blue-600">chaos</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg leading-relaxed text-gray-500">
            Join your clinic queue remotely and arrive exactly when it's your turn. Professional healthcare tracking designed for your time.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            {role !== "provider" && (
              <Link
                href="/doctors"
                className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Find a Doctor
              </Link>
            )}
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl bg-blue-50 text-blue-600 px-8 py-3.5 text-sm font-semibold transition hover:bg-blue-100"
            >
               <PlayCircle className="h-4 w-4" /> How it works
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 relative rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Patient" className="object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-600">Trusted by <span className="text-gray-900 font-bold">10k+</span> patients daily</p>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-16 lg:mt-0 lg:w-1/2 flex justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 blur-3xl rounded-full z-0 pointer-events-none" />
          
          {/* Phone Mockup Frame */}
          <div className="relative z-10 w-full max-w-[320px] rounded-[3rem] border-[8px] border-gray-900 bg-white ring-1 ring-gray-900/10 shadow-2xl overflow-hidden aspect-[1/2.1]">
            <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-1/2 mx-auto z-50 pointer-events-none" />
            
            {/* Phone Screen UI */}
            <div className="h-full w-full bg-gray-50 flex flex-col">
               <div className="bg-blue-600 p-6 pt-12 pb-16 text-white text-center">
                 <p className="text-xs font-semibold text-blue-200">QUEUE TICKET</p>
                 <h3 className="text-lg font-bold mt-1">Dr. Sarah Johnson</h3>
                 <div className="mt-6 mx-auto bg-white text-blue-600 rounded-2xl py-4 shadow-lg w-3/4">
                   <p className="text-xs font-bold text-gray-400">YOUR NUMBER</p>
                   <p className="text-4xl font-black tracking-tighter mt-1">#04</p>
                 </div>
               </div>
               
               <div className="flex-1 bg-white -mt-6 rounded-t-3xl p-6 relative">
                 <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Estimated Wait</p>
                    <p className="text-sm font-bold text-gray-900">12 min</p>
                 </div>
                 <div className="flex justify-between items-center py-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Clinic Status</p>
                    <p className="text-sm font-bold text-green-600">On Time</p>
                 </div>
                 <button className="mt-8 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold shadow hover:bg-blue-700">
                    Refresh Status
                 </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Patient journey, reimagined</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">Three simple steps to claim your time back from the waiting room bench.</p>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Search, title: "Find & Join", desc: "Search for your favorite clinic or specialist and join their virtual queue with one tap." },
              { icon: Activity, title: "Live Monitor", desc: "Get real-time updates on your position, medical delays, and live estimated wait amounts." },
              { icon: MapPin, title: "Arrive & Meet", desc: "Receive push notifications when you're next. Walk in and see your doctor immediately." }
            ].map((step, i) => (
              <div key={i} className="rounded-3xl bg-white p-8 sm:p-10 text-left shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Section Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl leading-tight">
              Access top-tier healthcare<br />professionals
            </h2>
            <div className="mt-10 space-y-4 relative">
              {/* Fake Doctor Card 1 */}
              <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm w-full max-w-md backdrop-blur-sm z-10 relative">
                 <div className="flex items-center gap-4">
                   <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop" className="h-12 w-12 rounded-xl object-cover" alt="Doctor" />
                   <div>
                     <p className="text-sm font-bold text-gray-900">Dr. Michael Chen</p>
                     <p className="text-xs text-blue-600 font-semibold mb-1">Cardiology Specialist</p>
                     <p className="text-[10px] text-gray-500">2 Patients Ahead</p>
                   </div>
                 </div>
                 <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                   <ArrowRight className="h-4 w-4" />
                 </div>
              </div>
              
              {/* Fake Doctor Card 2 */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm w-full max-w-md opacity-80 scale-[0.98] origin-left -mt-2 z-0">
                 <div className="flex items-center gap-4">
                   <img src="https://images.unsplash.com/photo-1594824436998-d40d995c255c?w=150&h=150&fit=crop" className="h-12 w-12 rounded-xl object-cover" alt="Doctor" />
                   <div>
                     <p className="text-sm font-bold text-gray-900">Dr. Elena Rodriguez</p>
                     <p className="text-xs text-blue-600 font-semibold mb-1">Pediatrician</p>
                     <p className="text-[10px] text-gray-500">Queue Paused</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 lg:mt-0 lg:w-1/2">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl">
               <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000" alt="Clinic Interior" className="w-full h-auto object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent flex flex-col justify-end p-8">
                 <h3 className="text-white font-bold text-xl">Modern Care Facilities</h3>
                 <p className="text-blue-100 text-sm mt-1">Connect with top clinics locally.</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Grid of Micro Features */}
      <section className="border-t border-gray-100 py-20 bg-white">
         <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Bell, title: "Smart Alerts", desc: "Receive SMS or push notifications when your turn is approaching." },
                { icon: LineChart, title: "Real-Time Analytics", desc: "View historical clinic delays to pick the optimal time to join." },
                { icon: FileText, title: "Digital Records", desc: "Keep track of past visits and consultation data via a single secure vault." },
                { icon: Users, title: "Family Accounts", desc: "Manage queues for yourself, children, and elderly family members simultaneously." }
              ].map((feat, i) => (
                <div key={i}>
                  <feat.icon className="h-6 w-6 text-blue-600 mb-3" />
                  <h4 className="font-bold text-gray-900">{feat.title}</h4>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* Testimonial */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gray-50 overflow-hidden flex flex-col md:flex-row">
            <div className="p-10 md:p-14 md:w-3/5 flex flex-col justify-center">
               <Quote className="h-10 w-10 text-blue-600 mb-6 opacity-50" />
               <p className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
                 "E7gzly changed how I manage my chronic condition visits. I no longer waste hours in a crowded room. I grab a coffee next door and walk in exactly when the app tells me to."
               </p>
               <div className="mt-8 flex items-center gap-3">
                 <img src="https://i.pravatar.cc/150?img=32" className="h-10 w-10 rounded-full" alt="User" />
                 <div>
                   <p className="font-bold text-gray-900 text-sm">Sarah Jenkins</p>
                   <p className="text-xs text-gray-500">Patient since 2024</p>
                 </div>
               </div>
            </div>
            <div className="md:w-2/5 bg-gradient-to-br from-gray-200 to-blue-200 relative min-h-[300px]">
               {/* Abstract visual graphic imitating ECG or app wave */}
               <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-overlay">
                 <Activity className="h-32 w-32 text-blue-900" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gray-900 p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-blue-600 blur-[100px] rounded-full opacity-20" />
            <h2 className="relative z-10 text-3xl font-bold text-white sm:text-4xl text-balance">
              Ready to stop waiting?
            </h2>
            <p className="relative z-10 mt-4 text-gray-400 max-w-2xl mx-auto">
              Join thousands of patients who use E7gzly to skip the waiting room.
            </p>
            <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white text-gray-900 px-8 py-3.5 text-sm font-semibold shadow transition hover:bg-gray-100"
              >
                Create Free Account
              </Link>
              <Link
                href="/doctors"
                className="rounded-xl bg-blue-600 text-white px-8 py-3.5 text-sm font-semibold shadow transition hover:bg-blue-500"
              >
                Find a Doctor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-blue-50/30 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
           <div className="grid gap-12 md:grid-cols-4">
              <div className="md:col-span-2">
                <Link href="/" className="text-2xl font-bold text-blue-600 block mb-4">
                  E7gzly
                </Link>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Pioneering modern medical queue management, linking healthcare professionals to patients.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><Link href="/doctors" className="hover:text-blue-600">Find Doctors</Link></li>
                  <li><Link href="/login" className="hover:text-blue-600">Patient Login</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-blue-600">How it Works</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-4">Providers</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><Link href="/login" className="hover:text-blue-600">Clinic Portal</Link></li>
                  <li><Link href="/register" className="hover:text-blue-600">Join Directory</Link></li>
                  <li><Link href="/support" className="hover:text-blue-600">Support Center</Link></li>
                </ul>
              </div>
           </div>
           
           <div className="mt-16 border-t border-gray-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-xs text-gray-400">© 2026 E7gzly Medical Systems. All rights reserved.</p>
             <div className="flex gap-4">
               <span className="h-6 w-6 rounded bg-gray-200"></span>
               <span className="h-6 w-6 rounded bg-gray-200"></span>
             </div>
           </div>
        </div>
      </footer>
    </div>
  )
}
