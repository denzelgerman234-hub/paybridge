import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  { q: 'What is PayBridge Workers?', a: 'PayBridge Workers is a platform that connects businesses with verified workers who disburse payments to recipients and have worker fees recorded after verified gigs.' },
  { q: 'How do I become a worker?', a: 'Complete the application, training, quiz, and interview process. Once approved, you can apply for open disbursement gigs.' },
  { q: 'How does the badge system work?', a: 'Badges (Trainee, Associate, Senior, Expert, Master) are earned by completing gigs and disbursing higher volumes. Higher badges unlock better gigs.' },
  { q: 'How are worker fees calculated?', a: 'Worker fees are a percentage of the total principal amount for each gig. Rates vary based on your badge tier and gig complexity, then are recorded after verification.' },
  { q: 'When is my worker fee recorded?', a: 'Worker fees are recorded after each gig is completed and verified. PayBridge does not hold a platform balance.' },
  { q: 'Is my account safe from compliance issues?', a: 'We conduct regular account health checks and have a compliance system to ensure all disbursements meet regulatory standards.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(open === i ? null : i)}>
              <span className="font-medium text-gray-900">{faq.q}</span>
              {open === i ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {open === i && <div className="px-4 pb-4 text-gray-600">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

