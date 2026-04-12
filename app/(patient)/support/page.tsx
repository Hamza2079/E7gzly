import { HelpCircle } from "lucide-react"

export const metadata = {
  title: "Support & FAQ",
}

export default function SupportPage() {
  const faqs = [
    {
      q: "How does the estimated wait time work?",
      a: "Our algorithm calculates your wait time based on the doctor's average consultation duration multiplied by the number of patients ahead of you. However, this is an estimate and can change if emergency cases arrive."
    },
    {
      q: "What happens if I miss my turn?",
      a: "E7gzly offers a Grace Period (customizable by each clinic). If your turn arrives and you are not present, your status changes to 'No Show'. Depending on the clinic's policy, you may be skipped permanently or pushed back by a few slots."
    },
    {
      q: "How do I cancel my queue ticket?",
      a: "You can open your 'My Queue' page, click on your active ticket, and hit the 'Cancel Joining' button. Please try to cancel as early as possible so other patients can take your spot."
    },
    {
      q: "Can I join multiple queues at once?",
      a: "No. To prevent spam and ensure fairness, our platform strictly limits patients to one active queue entry at any given time."
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support & FAQ</h1>
        <p className="mt-1 text-gray-500">Need help? Find answers to the most common questions below.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="divide-y divide-gray-50">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 p-6 text-center">
             <p className="text-sm font-medium text-gray-900">Still need help?</p>
             <p className="mt-1 text-sm text-gray-500">Contact our support team directly.</p>
             <a href="mailto:support@e7gzly.com" className="font-semibold text-blue-600 hover:text-blue-700 text-sm mt-3 inline-block">
               support@e7gzly.com
             </a>
          </div>
        </div>
      </div>
    </div>
  )
}
