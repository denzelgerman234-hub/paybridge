import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    category: 'The Basics',
    items: [
      { q: 'What is PayBridge?', a: 'PayBridge is a licensed Money Services Business (MSB) registered with FinCEN. We connect organizations that need funds disbursed with verified workers who execute those disbursements on their behalf.' },
      { q: 'Do I ever use my own money?', a: 'Never. PayBridge deposits the full principal into your dedicated disbursement account before you send a single dollar. You use pre-funded money, not your own.' },
      { q: 'How much can I earn?', a: 'Workers earn a 10-15% worker fee per gig based on their badge tier: Trainee 10%, Associate 10%, Senior 11%, Expert 13%, Elite 15%.' },
      { q: 'Am I an employee or contractor?', a: 'You are an independent contractor. PayBridge issues a 1099-NEC for workers earning over $600 annually. You are responsible for your own taxes.' },
    ],
  },
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I apply?', a: 'Click "Apply Now" and complete the short 4-step application. We review within 1-2 business days. Then you complete manual identity review, training, quiz, a brief interview, and bank account setup.' },
      { q: 'What banks are accepted?', a: 'We support 29 major US financial institutions including Wells Fargo, Chase, Bank of America, USAA, Navy Federal, Citibank, and more. Your dedicated disbursement account must be at one of these banks.' },
      { q: 'What is a "dedicated" account?', a: 'An account used exclusively for PayBridge disbursements: no personal spending, bills, or other gig income. This is verified through Plaid during onboarding.' },
    ],
  },
  {
    category: 'Doing Gigs',
    items: [
      { q: 'How do gigs work?', a: 'You browse open gigs, apply for one you qualify for, wait for Operations approval, confirm the principal is pre-funded in your dedicated account, execute disbursements to recipients, upload proof, and see your worker fee recorded when the gig is verified complete.' },
      { q: 'What if a recipient does not get their funds?', a: 'Stop immediately. Do not retry. Contact PayBridge support via the incident form. You are protected when you report proactively.' },
      { q: 'What proof do I need to upload?', a: 'After each disbursement: a screenshot of the transaction and the Transaction ID (TXID). Upload immediately in the gig dashboard.' },
    ],
  },
  {
    category: 'Compliance & Safety',
    items: [
      { q: 'What are red flags I should watch for?', a: 'Any instruction to use your personal account, to send funds before they are deposited, to skip proof uploads, or to communicate outside the platform dashboard are all red flags. Report them immediately.' },
      { q: 'What happens if I violate the rules?', a: 'Violations result in badge penalties, account suspension, or permanent termination. Depending on severity, PayBridge may report to FinCEN.' },
      { q: 'Is PayBridge legal?', a: 'Yes. PayBridge is a FinCEN-registered Money Services Business (MSB). All operations comply with US AML, OFAC, and Bank Secrecy Act requirements.' },
    ],
  },
];

export function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center mb-10">
        <p className="section-label mb-3">Support</p>
        <h1 className="text-3xl md:text-4xl font-black text-cream">Frequently Asked Questions</h1>
        <p className="text-cream/50 mt-3">Everything you need to know about worker onboarding, gigs, safety, and payouts.</p>
      </div>

      <div className="space-y-6">
        {FAQS.map(section => (
          <section key={section.category}>
            <h2 className="text-lg font-bold text-cream mb-3">{section.category}</h2>
            <Card padding="none">
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {section.items.map(item => {
                  const key = `${section.category}-${item.q}`;
                  const isOpen = open === key;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                      >
                        <span className="font-semibold text-sm text-cream">{item.q}</span>
                        <ChevronRight size={16} className={`text-cream/50 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {isOpen && <p className="px-4 pb-4 text-sm text-cream/60 leading-relaxed">{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        ))}
      </div>

      <div className="mt-10 card p-6 text-center">
        <h2 className="font-bold text-cream mb-2">Still need help?</h2>
        <p className="text-sm text-cream/50 mb-4">Send our support team a note and we will help you sort it out.</p>
        <Link to="/contact"><button className="btn-secondary">Contact Support <ArrowRight size={14} /></button></Link>
      </div>
    </div>
  );
}