import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, User, Mail, Phone, Globe, FileText, ChevronRight } from 'lucide-react';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PARTNER_BANKS, DISBURSEMENT_METHODS } from '../lib/constants';
import toast from 'react-hot-toast';
import { useSmartBack } from '../hooks/useSmartBack';

const COUNTRIES = ['United States'];


const steps = ['Personal Info', 'Background', 'Methods & Banks', 'Certify & Submit'];

export function ApplyPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const goBack = useSmartBack('/');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', country: '', city: '',
    occupation: '', why: '',
    banks: [] as string[], account_count: '1', methods: [] as string[],
    agree_terms: false, agree_conduct: false,
  });

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  function toggleMethod(m: string) {
    setForm(p => ({ ...p, methods: p.methods.includes(m) ? p.methods.filter(x => x !== m) : [...p.methods, m] }));
  }

  function toggleBank(bank: string) {
    setForm(p => ({ ...p, banks: p.banks.includes(bank) ? p.banks.filter(x => x !== bank) : [...p.banks, bank] }));
  }

  function handleSubmit() {
    toast.success('Application submitted! Check your email for next steps.');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 rounded mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(125,201,154,0.1)', border: '1px solid rgba(125,201,154,0.25)' }}>
          <CheckCircle size={28} strokeWidth={1.5} style={{ color: '#7DC99A' }} />
        </div>
        <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F0DA' }}>Application Submitted</h1>
        <p className="mb-6" style={{ color: 'rgba(241,240,218,0.5)', fontSize: 14 }}>
          We'll review your application and email you within 1-2 business days with your next steps, including manual identity review.
        </p>
        <div className="card p-5 text-left mb-8 space-y-3" style={{ fontSize: 13 }}>
          {[
            { done: true,  label: 'Application received' },
            { done: false, label: 'Manual identity review - email incoming' },
            { done: false, label: 'Background review' },
            { done: false, label: 'Account activation + training access' },
          ].map(({ done, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              {done
                ? <CheckCircle size={13} strokeWidth={2} style={{ color: '#7DC99A', flexShrink: 0 }} />
                : <Clock       size={13} strokeWidth={1.5} style={{ color: '#C9A84C', flexShrink: 0 }} />}
              <span style={{ color: done ? '#F1F0DA' : 'rgba(241,240,218,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={goBack} className="btn-secondary">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#f8f8ff] mb-2">Apply to Become a Worker</h1>
        <p className="text-[#a8a4c4]">Takes less than 5 minutes. Free to apply.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex flex-col items-center`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-white/10 text-[#a8a4c4]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 text-[#a8a4c4] hidden sm:block whitespace-nowrap">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 mx-2 transition-colors" style={{ background: i < step ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Personal Information</h2>
            <Input label="Full Legal Name" value={form.full_name} onChange={up('full_name')} placeholder="As on your government ID" icon={<User size={15} />} />
            <Input label="Email Address" type="email" value={form.email} onChange={up('email')} placeholder="you@email.com" icon={<Mail size={15} />} />
            <Input label="Phone Number" type="tel" value={form.phone} onChange={up('phone')} placeholder="+1 555 000 1234" icon={<Phone size={15} />} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#a8a4c4]">Country</label>
                <select value={form.country} onChange={up('country')} className="input-dark appearance-none">
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#1e1c35]">{c}</option>)}
                </select>
              </div>
              <Input label="City" value={form.city} onChange={up('city')} placeholder="Your city" icon={<Globe size={15} />} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Background</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a8a4c4]">Current Occupation</label>
              <select value={form.occupation} onChange={up('occupation')} className="input-dark appearance-none">
                <option value="">Select occupation</option>
                {['Employed full-time', 'Employed part-time', 'Self-employed', 'Student', 'Retired', 'Unemployed', 'Other'].map(o => (
                  <option key={o} value={o} className="bg-[#1e1c35]">{o}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a8a4c4]">Why do you want to join PayBridge?</label>
              <textarea value={form.why} onChange={up('why')} rows={4} placeholder="Tell us about your motivation and relevant experience (e.g., finance, banking, money transfers)..." className="input-dark resize-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Methods & Bank Accounts</h2>
            <div>
              <p className="text-sm font-medium text-[#a8a4c4] mb-3">Disbursement methods you can use:</p>
              <div className="grid grid-cols-2 gap-2">
                {DISBURSEMENT_METHODS.map(m => (
                  <label key={m.id} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${
                    form.methods.includes(m.id) ? 'border-primary-500/40 bg-primary-500/10 text-[#f8f8ff]' : 'border-white/8 text-[#a8a4c4] hover:border-primary-500/20'
                  }`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.methods.includes(m.id) ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>
                      {form.methods.includes(m.id) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <input type="checkbox" className="hidden" checked={form.methods.includes(m.id)} onChange={() => toggleMethod(m.id)} />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#a8a4c4] mb-3">Partner banks you can use:</p>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {PARTNER_BANKS.map(bank => (
                  <label key={bank} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${
                    form.banks.includes(bank) ? 'border-primary-500/40 bg-primary-500/10 text-[#f8f8ff]' : 'border-white/8 text-[#a8a4c4] hover:border-primary-500/20'
                  }`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.banks.includes(bank) ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>
                      {form.banks.includes(bank) && <span className="text-white text-xs">+</span>}
                    </div>
                    <input type="checkbox" className="hidden" checked={form.banks.includes(bank)} onChange={() => toggleBank(bank)} />
                    <span className="text-sm">{bank}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#a8a4c4] mb-2">Dedicated accounts estimate:</p>
              <select value={form.account_count} onChange={up('account_count')} className="input-dark appearance-none">
                {['1', '2', '3', '4+'].map(count => <option key={count} value={count} className="bg-[#1e1c35]">{count}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Certifications & Agreements</h2>
            <div className="space-y-3">
              {[
                { key: 'agree_terms', label: 'I agree to the PayBridge Worker Terms of Service and understand I am an independent contractor (1099-NEC).' },
                { key: 'agree_conduct', label: 'I have read and agree to the Code of Conduct, including the requirement to maintain a dedicated disbursement account and never use personal funds for disbursements.' },
              ].map(({ key, label }) => (
                <label key={key} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  (form as any)[key] ? 'border-primary-500/30 bg-primary-500/8' : 'border-white/8'
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 flex-shrink-0 transition-all ${(form as any)[key] ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>
                    {(form as any)[key] && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input type="checkbox" className="hidden" checked={(form as any)[key]} onChange={() => setForm(p => ({ ...p, [key]: !(p as any)[key] }))} />
                  <p className="text-sm text-[#a8a4c4]">{label}</p>
                </label>
              ))}
            </div>
            <div className="text-xs text-[#a8a4c4] p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              By submitting you certify that all information is accurate and complete. False information will result in immediate disqualification.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/8">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Continue <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!form.agree_terms || !form.agree_conduct}
              icon={<FileText size={15} />}
            >
              Submit Application
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

