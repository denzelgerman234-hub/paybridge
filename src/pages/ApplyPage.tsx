import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, ChevronRight, FileText, Globe, Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PARTNER_BANKS, DISBURSEMENT_METHODS } from '../lib/constants';

const COUNTRIES = ['United States'];
const steps = ['Account', 'Background', 'Methods & Banks', 'Certify'];

function friendlyApplyError(err: any): string {
  // Supabase can return an error object with no message (empty body) — guard against showing raw `{}`
  const raw = err?.message ?? err?.msg ?? err?.error_description ?? '';
  const message = typeof raw === 'string' ? raw.trim() : '';
  // Ignore messages that are just a serialised empty object or whitespace
  const isEmpty = !message || message === '{}' || message === '[]';
  const lower = message.toLowerCase();
  if (err?.code === 'supabase_not_configured') return 'Signup is not connected yet. Please contact support.';
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already')) return 'An account with this email already exists. Try signing in instead.';
  if (lower.includes('invalid email')) return 'Enter a valid email address.';
  if (lower.includes('password')) return message;
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many signup attempts. Please wait a moment and try again.';
  if (isEmpty) return 'Application could not be submitted. Please try again.';
  return message;
}

export function ApplyPage() {
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', country: '', city: '', password: '', confirm: '',
    occupation: '', why: '', banks: [] as string[], account_count: '1', methods: [] as string[],
    agree_terms: false, agree_conduct: false,
  });

  const up = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(previous => ({ ...previous, [key]: event.target.value }));

  function toggleMethod(method: string) {
    setForm(previous => ({ ...previous, methods: previous.methods.includes(method) ? previous.methods.filter(item => item !== method) : [...previous.methods, method] }));
  }

  function toggleBank(bank: string) {
    setForm(previous => ({ ...previous, banks: previous.banks.includes(bank) ? previous.banks.filter(item => item !== bank) : [...previous.banks, bank] }));
  }

  function validateStep(currentStep = step) {
    if (currentStep === 0) {
      if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.country || !form.city.trim() || !form.password || !form.confirm) return 'Complete all account fields.';
      if (form.password !== form.confirm) return 'Passwords do not match.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
    }
    if (currentStep === 1 && (!form.occupation || !form.why.trim())) return 'Complete your background details.';
    if (currentStep === 2 && (form.methods.length === 0 || form.banks.length === 0)) return 'Select at least one method and one partner bank.';
    if (currentStep === 3 && (!form.agree_terms || !form.agree_conduct)) return 'Accept the required certifications to submit.';
    return '';
  }

  function nextStep() {
    const message = validateStep();
    if (message) { setError(message); return; }
    setError('');
    setStep(current => current + 1);
  }

  async function handleSubmit() {
    const message = validateStep(3);
    if (message) { setError(message); return; }

    setError('');
    setLoading(true);
    try {
      // All application fields are passed as user_metadata so the
      // handle_new_user() DB trigger can create the worker_applications row
      // without needing a live session or anonymous insert access.
      await signUp(
        form.email,
        form.password,
        form.full_name,
        form.phone,
        form.country,
        {
          city: form.city.trim(),
          occupation: form.occupation,
          why: form.why.trim(),
          bank: form.banks[0] ?? '',
          methods: form.methods,
          notes: `Available banks: ${form.banks.join(', ')}. Dedicated accounts: ${form.account_count}.`,
        },
      );
      toast.success('Application submitted. Verify your email to continue.');
    } catch (err: any) {
      setError(friendlyApplyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#f8f8ff] mb-2">Apply to Become a Worker</h1>
        <p className="text-[#a8a4c4]">One secure application creates your account and sends it to admin review.</p>
      </div>

      <div className="flex items-center mb-8">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                index < step ? 'bg-emerald-500 text-white' : index === step ? 'bg-primary-500 text-white' : 'bg-white/10 text-[#a8a4c4]'
              }`}>
                {index < step ? <CheckCircle size={14} /> : index + 1}
              </div>
              <span className="text-xs mt-1 text-[#a8a4c4] hidden sm:block whitespace-nowrap">{label}</span>
            </div>
            {index < steps.length - 1 && <div className="h-px flex-1 mx-2 transition-colors" style={{ background: index < step ? '#10b981' : 'rgba(255,255,255,0.1)' }} />}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Account & Personal Information</h2>
            <Input label="Full Legal Name" value={form.full_name} onChange={up('full_name')} placeholder="As on your government ID" icon={<User size={15} />} />
            <Input label="Email Address" type="email" value={form.email} onChange={up('email')} placeholder="you@email.com" icon={<Mail size={15} />} />
            <Input label="Phone Number" type="tel" value={form.phone} onChange={up('phone')} placeholder="+1 555 000 1234" icon={<Phone size={15} />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="label-caps block">Country</label>
                <select value={form.country} onChange={up('country')} className="input-dark appearance-none">
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => <option key={country} value={country} className="bg-[#1e1c35]">{country}</option>)}
                </select>
              </div>
              <Input label="City" value={form.city} onChange={up('city')} placeholder="Your city" icon={<Globe size={15} />} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Password" type="password" value={form.password} onChange={up('password')} placeholder="Min 8 characters" icon={<Lock size={15} />} />
              <Input label="Confirm Password" type="password" value={form.confirm} onChange={up('confirm')} placeholder="Repeat password" icon={<Lock size={15} />} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Work Background</h2>
            <div className="space-y-1.5">
              <label className="label-caps block">Current Occupation</label>
              <select value={form.occupation} onChange={up('occupation')} className="input-dark appearance-none">
                <option value="">Select occupation</option>
                {['Employed full-time', 'Employed part-time', 'Self-employed', 'Student', 'Retired', 'Unemployed', 'Other'].map(occupation => <option key={occupation} value={occupation} className="bg-[#1e1c35]">{occupation}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-caps block">Why do you want to join PayBridge?</label>
              <textarea value={form.why} onChange={up('why')} rows={4} placeholder="Tell us about your motivation and relevant finance, banking, or transfer experience." className="input-dark resize-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Methods & Bank Accounts</h2>
            <div>
              <p className="label-caps mb-3">Disbursement methods you can use</p>
              <div className="grid grid-cols-2 gap-2">
                {DISBURSEMENT_METHODS.map(method => (
                  <label key={method.id} className={`flex items-center gap-2 p-3 rounded cursor-pointer border transition-all ${form.methods.includes(method.id) ? 'border-primary-500/40 bg-primary-500/10 text-[#f8f8ff]' : 'border-white/8 text-[#a8a4c4] hover:border-primary-500/20'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.methods.includes(method.id) ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>{form.methods.includes(method.id) && <CheckCircle size={12} />}</div>
                    <input type="checkbox" className="hidden" checked={form.methods.includes(method.id)} onChange={() => toggleMethod(method.id)} />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="label-caps mb-3">Partner banks you can use</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {PARTNER_BANKS.map(bank => (
                  <label key={bank} className={`flex items-center gap-2 p-3 rounded cursor-pointer border transition-all ${form.banks.includes(bank) ? 'border-primary-500/40 bg-primary-500/10 text-[#f8f8ff]' : 'border-white/8 text-[#a8a4c4] hover:border-primary-500/20'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${form.banks.includes(bank) ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>{form.banks.includes(bank) && <CheckCircle size={12} />}</div>
                    <input type="checkbox" className="hidden" checked={form.banks.includes(bank)} onChange={() => toggleBank(bank)} />
                    <span className="text-sm">{bank}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label-caps block">Dedicated accounts estimate</label>
              <select value={form.account_count} onChange={up('account_count')} className="input-dark appearance-none">
                {['1', '2', '3', '4+'].map(count => <option key={count} value={count} className="bg-[#1e1c35]">{count}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-[#f8f8ff] mb-4">Certifications & Agreements</h2>
            {[
              { key: 'agree_terms', label: 'I agree to the PayBridge Worker Terms and understand I am applying as an independent contractor.' },
              { key: 'agree_conduct', label: 'I agree to maintain a dedicated disbursement account and never use personal funds for platform disbursements.' },
            ].map(({ key, label }) => (
              <label key={key} className={`flex items-start gap-3 p-4 rounded cursor-pointer border transition-all ${(form as any)[key] ? 'border-primary-500/30 bg-primary-500/8' : 'border-white/8'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 flex-shrink-0 transition-all ${(form as any)[key] ? 'bg-primary-500 border-primary-400' : 'border-[#a8a4c4]'}`}>{(form as any)[key] && <CheckCircle size={13} />}</div>
                <input type="checkbox" className="hidden" checked={(form as any)[key]} onChange={() => setForm(previous => ({ ...previous, [key]: !(previous as any)[key] }))} />
                <p className="text-sm text-[#a8a4c4]">{label}</p>
              </label>
            ))}
            <div className="text-xs text-[#a8a4c4] p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              Submitting creates your login account, sends a verification email, and places your worker application in the admin review queue.
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400 text-center mt-5">{error}</p>}

        <div className="flex gap-3 mt-6 pt-6 border-t border-white/8">
          {step > 0 && <Button variant="secondary" disabled={loading} onClick={() => { setError(''); setStep(current => current - 1); }}>Back</Button>}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <Button onClick={nextStep}>Continue <ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} disabled={loading || !form.agree_terms || !form.agree_conduct} icon={<FileText size={15} />}>
              Submit Application
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

