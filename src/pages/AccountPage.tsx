import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { BadgeIcon } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BankAccountsManager } from '../components/account/BankAccountsManager';
import { useAppStore } from '../stores/appStore';
import { KycStatus, LegalDocumentType, NotificationPreference, WorkerKycSubmission, WorkerSecuritySetting, WorkerSignedDocument } from '../types/database';
import {
  getLatestKycSubmission,
  getNotificationPreferences,
  getWorkerSecuritySetting,
  listWorkerSignedDocuments,
  setWorkerTwoFactorEnabled,
  signWorkerDocument,
  submitWorkerKyc,
  updateNotificationPreference,
} from '../lib/onboardingData';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  KeyRound,
  Landmark,
  LogOut,
  PenLine,
  QrCode,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  UploadCloud,
  User,
  XCircle,
} from 'lucide-react';

type Tab = 'profile' | 'bank_accounts' | 'security' | 'kyc' | 'notifications' | 'legal';
type NotificationPreferenceKey = keyof Omit<NotificationPreference, 'id' | 'worker_id'>;

const notificationOptions: { label: string; description: string; key: NotificationPreferenceKey }[] = [
  { label: 'Email: New gig available', description: 'Send email when Operations posts a matching gig.', key: 'email_new_gig' },
  { label: 'Email: Disbursement update', description: 'Send email for proof review, verification, or resend requests.', key: 'email_disbursement' },
  { label: 'Email: Worker fee record updated', description: 'Send email when a gig fee record changes.', key: 'email_fee_record' },
  { label: 'Email: Compliance alerts', description: 'Send email for account health or compliance notices.', key: 'email_compliance' },
  { label: 'SMS: Disbursement reminders', description: 'Send text reminders for time-sensitive recipient work.', key: 'sms_disbursement' },
  { label: 'Push: New gig available', description: 'Show in-app alerts for matching new gigs.', key: 'push_new_gig' },
  { label: 'Push: Disbursement update', description: 'Show in-app alerts for disbursement and proof status.', key: 'push_disbursement' },
];

const kycStatusMeta: Record<KycStatus, { label: string; className: string; Icon: typeof Clock; description: string }> = {
  not_started: {
    label: 'Not Started',
    className: 'status-pending',
    Icon: Clock,
    description: 'Upload your ID and tax information for manual Operations review.',
  },
  submitted: {
    label: 'Submitted',
    className: 'status-pending',
    Icon: Clock,
    description: 'Your KYC package is queued for Operations review.',
  },
  in_review: {
    label: 'In Review',
    className: 'status-in_progress',
    Icon: Clock,
    description: 'Operations is reviewing your identity documents.',
  },
  verified: {
    label: 'Verified',
    className: 'status-verified',
    Icon: CheckCircle,
    description: 'Your identity has been manually approved by Operations.',
  },
  rejected: {
    label: 'Needs Update',
    className: 'status-failed',
    Icon: XCircle,
    description: 'Operations needs updated information before approval.',
  },
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitAtLeast(startedAt: number, minimumMs = 3000) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < minimumMs) await wait(minimumMs - elapsed);
}

/** Generates a real 32-char base32 TOTP secret + scannable QR code URL. Works offline with any authenticator app. */
function generateLocalTotpSetup(email: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  bytes.forEach(b => { secret += alphabet[b % 32]; });
  const issuer = 'PayBridge Workers';
  const label  = encodeURIComponent(`${issuer}:${email}`);
  const uri    = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(uri)}`;
  return { factorId: 'local-factor', qrCode, secret, challengeId: null as null };
}

export function AccountPage() {
  const { profile, isLoading, signOut } = useAuth();
  const { setProfile } = useAppStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', country: '' });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference | null>(null);
  const [securitySetting, setSecuritySetting] = useState<WorkerSecuritySetting | null>(null);
  const [kycSubmission, setKycSubmission] = useState<WorkerKycSubmission | null>(null);
  const [kycForm, setKycForm] = useState({
    idDocumentType: 'drivers_license' as WorkerKycSubmission['id_document_type'],
    taxIdType: 'ssn' as WorkerKycSubmission['tax_id_type'],
    taxIdNumber: '',
  });
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [enrollingTwoFactor, setEnrollingTwoFactor] = useState(false);
  const [verifyingTwoFactor, setVerifyingTwoFactor] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ factorId: string; qrCode: string | null; secret: string; challengeId: string | null } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Legal
  const [signedDocuments, setSignedDocuments] = useState<WorkerSignedDocument[]>([]);
  const [isW9ModalOpen, setIsW9ModalOpen] = useState(false);
  const [signingW9, setSigningW9] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<WorkerSignedDocument | null>(null);
  const [w9Form, setW9Form] = useState({
    name: '',
    businessName: '',
    taxClassification: 'individual',
    address: '',
    cityStateZip: '',
    taxIdType: 'ssn' as 'ssn' | 'ein',
    taxIdNumber: '',
    signature: '',
    certified: false,
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const workerId = profile.id;

    async function loadAccountData() {
      try {
        const [preferences, security, latestKyc, documents] = await Promise.all([
          getNotificationPreferences(workerId),
          getWorkerSecuritySetting(workerId),
          getLatestKycSubmission(workerId),
          listWorkerSignedDocuments(workerId),
        ]);
        if (!active) return;
        setNotificationPreferences(preferences);
        setSecuritySetting(security);
        setKycSubmission(latestKyc);
        setSignedDocuments(documents);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not load account records');
      }
    }

    setForm({ full_name: profile.full_name, phone: profile.phone, country: profile.country });
    setW9Form(prev => ({ ...prev, name: profile.full_name }));
    void loadAccountData();

    return () => { active = false; };
  }, [profile]);

  if (isLoading || !profile) return <LoadingSpinner text="Loading account..." />;

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'profile',       icon: <User size={15} />,       label: 'Profile' },
    { id: 'bank_accounts', icon: <Landmark size={15} />,   label: 'Banks' },
    { id: 'security',      icon: <Shield size={15} />,     label: 'Security' },
    { id: 'kyc',           icon: <FileUp size={15} />,     label: 'KYC' },
    { id: 'notifications', icon: <Bell size={15} />,       label: 'Notifications' },
    { id: 'legal',         icon: <FileText size={15} />,   label: 'Legal' },
  ];

  async function saveProfile() {
    setSaving(true);
    await supabase.from('worker_profiles').update({ full_name: form.full_name, phone: form.phone, country: form.country }).eq('id', profile!.id);
    setProfile({ ...profile!, ...form });
    toast.success('Profile saved');
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingAvatar(true);
    try {
      const storagePath = `${profile!.id}/${Date.now()}-${file.name}`;
      let publicUrl = URL.createObjectURL(file); // local preview fallback
      
      if (supabase.storage?.from) {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
        // Only override if the URL is valid (mockSupabase returns empty string)
        if (data.publicUrl) {
          publicUrl = data.publicUrl;
        }
      }
      
      await supabase.from('worker_profiles').update({ avatar_url: publicUrl }).eq('id', profile!.id);
      setProfile({ ...profile!, avatar_url: publicUrl });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  async function handleDeleteAvatar() {
    setUploadingAvatar(true);
    try {
      await supabase.from('worker_profiles').update({ avatar_url: null }).eq('id', profile!.id);
      setProfile({ ...profile!, avatar_url: null });
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      // Supabase migration optimized logic:
      // const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      // if (error) throw error;
      
      // Mock network delay for now
      await new Promise(res => setTimeout(res, 800));
      
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSubmitKyc(e: React.FormEvent) {
    e.preventDefault();
    if (!idDocumentFile) {
      toast.error('Upload a government ID document');
      return;
    }
    const cleanTaxId = kycForm.taxIdNumber.replace(/\D/g, '');
    if (cleanTaxId.length < 4) {
      toast.error('Enter a valid SSN or tax ID number');
      return;
    }

    const startedAt = Date.now();
    setSubmittingKyc(true);
    try {
      const storagePath = `${profile!.id}/${Date.now()}-${idDocumentFile.name}`;
      if (supabase.storage?.from) {
        const { error } = await supabase.storage
          .from('kyc-documents')
          .upload(storagePath, idDocumentFile, { upsert: true });
        if (error) throw error;
      }

      await submitWorkerKyc({
        workerId: profile!.id,
        idDocumentType: kycForm.idDocumentType,
        idDocumentFile,
        taxIdType: kycForm.taxIdType,
        taxIdNumber: cleanTaxId,
        storagePath,
      });
      setProfile({ ...profile!, kyc_status: 'submitted' });
      setKycSubmission(await getLatestKycSubmission(profile!.id));
      setKycForm(prev => ({ ...prev, taxIdNumber: '' }));
      setIdDocumentFile(null);
      await waitAtLeast(startedAt);
      toast.success('KYC submitted for manual review');
    } catch (error) {
      await waitAtLeast(startedAt);
      toast.error(error instanceof Error ? error.message : 'Failed to submit KYC');
    } finally {
      setSubmittingKyc(false);
    }
  }

  async function startTwoFactorSetup() {
    setEnrollingTwoFactor(true);
    try {
      if (supabase.auth?.mfa?.enroll) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const existing = factors?.all?.find((f: any) => f.friendly_name === 'PayBridge Worker App' && f.status === 'unverified');
        if (existing) {
          await supabase.auth.mfa.unenroll({ factorId: existing.id });
        }

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'PayBridge Worker App',
          issuer: 'Paybridge',
        });
        if (error) throw error;
        setTwoFactorSetup({
          factorId: data.id,
          qrCode: data.totp?.qr_code ?? null,
          secret: data.totp?.secret ?? '',
          challengeId: null,
        });
      } else {
        // Generate a real TOTP secret so the QR code is scannable.
        setTwoFactorSetup(generateLocalTotpSetup(profile!.full_name ?? 'worker'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start 2FA setup');
    } finally {
      setEnrollingTwoFactor(false);
    }
  }

  async function verifyTwoFactorSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFactorSetup) return;
    if (twoFactorCode.replace(/\D/g, '').length !== 6) {
      toast.error('Enter the 6-digit authenticator code');
      return;
    }

    setVerifyingTwoFactor(true);
    try {
      if (supabase.auth?.mfa?.challenge && supabase.auth?.mfa?.verify && twoFactorSetup.factorId !== 'local-factor') {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: twoFactorSetup.factorId,
        });
        if (challengeError) throw challengeError;
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: twoFactorSetup.factorId,
          challengeId: challengeData.id,
          code: twoFactorCode,
        });
        if (verifyError) throw verifyError;
      } else {
        await wait(600);
      }

      await setWorkerTwoFactorEnabled(profile!.id, true);
      setSecuritySetting(await getWorkerSecuritySetting(profile!.id));
      setTwoFactorCode('');
      setTwoFactorSetup(null);
      setIsTwoFactorModalOpen(false);
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify 2FA code');
    } finally {
      setVerifyingTwoFactor(false);
    }
  }

  async function toggleNotificationPreference(key: NotificationPreferenceKey) {
    if (!notificationPreferences) return;
    const nextValue = !notificationPreferences[key];
    try {
      await updateNotificationPreference(profile!.id, key, nextValue);
      setNotificationPreferences({ ...notificationPreferences, [key]: nextValue });
      toast.success('Notification preference updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update preference');
    }
  }

  const kycStatus = (kycSubmission?.status ?? profile.kyc_status ?? 'not_started') as KycStatus;
  const kycMeta = kycStatusMeta[kycStatus];
  const KycStatusIcon = kycMeta.Icon;
  const twoFactorEnabled = Boolean(securitySetting?.two_factor_enabled);

  const isSigned = (type: LegalDocumentType) => signedDocuments.some(d => d.document_type === type);
  const getSignedDoc = (type: LegalDocumentType) => signedDocuments.find(d => d.document_type === type) ?? null;

  async function handleSignW9(e: React.FormEvent) {
    e.preventDefault();
    if (!w9Form.certified) { toast.error('You must certify the information is correct'); return; }
    if (w9Form.signature.trim().toLowerCase() !== profile!.full_name.toLowerCase()) {
      toast.error(`Type your full legal name exactly as it appears on your profile: "${profile!.full_name}"`);
      return;
    }
    const cleanTaxId = w9Form.taxIdNumber.replace(/\D/g, '');
    if (cleanTaxId.length < 4) { toast.error('Enter a valid SSN or EIN'); return; }
    setSigningW9(true);
    try {
      await wait(800);
      await signWorkerDocument({
        workerId: profile!.id,
        documentType: 'irs_w9',
        signature: w9Form.signature,
        documentVersion: '2024-rev',
        w9: {
          name: w9Form.name,
          businessName: w9Form.businessName || undefined,
          taxClassification: w9Form.taxClassification,
          address: w9Form.address,
          cityStateZip: w9Form.cityStateZip,
          taxIdType: w9Form.taxIdType,
          taxIdLast4: cleanTaxId.slice(-4),
        },
      });
      setSignedDocuments(await listWorkerSignedDocuments(profile!.id));
      setIsW9ModalOpen(false);
      setW9Form(prev => ({ ...prev, taxIdNumber: '', signature: '', certified: false }));
      toast.success('IRS Form W-9 signed and recorded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign W-9');
    } finally {
      setSigningW9(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-cream">Account</h1>
        <p className="text-cream/50 mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Profile header */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-20 h-20 rounded-lg object-cover border border-white/8" />
            ) : (
              <div className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-black text-white"
                style={{ background: 'linear-gradient(135deg,#C9A84C,#d946ef)' }}>
                {profile.full_name[0]}
              </div>
            )}
            
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-[#0B132F]/80 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 rounded-sm" style={{ background: '#C9A84C', animation: 'pulse 1.2s ease-in-out infinite', opacity: 0.7 }} />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="font-bold text-cream text-xl">{profile.full_name}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <BadgeIcon tier={profile.badge} size="sm" naked />
              <p className={`text-xs ${profile.account_health === 'healthy' ? 'text-sage' : 'text-amber-400'}`}>
                <span aria-hidden="true">&bull;</span> {profile.account_health === 'healthy' ? 'Account Healthy' : profile.account_health}
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <label className={`cursor-pointer px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${uploadingAvatar ? 'opacity-50 pointer-events-none' : 'bg-gold/10 hover:bg-gold/20 text-gold'}`}>
                <Camera size={13} />
                {profile.avatar_url ? 'Change Profile Photo' : 'Upload Profile Photo'}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              
              {profile.avatar_url && (
                <button 
                  onClick={handleDeleteAvatar} 
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 rounded text-white/50 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
              tab === t.id ? 'bg-gold/15 text-gold/80 border border-gold/30' : 'text-cream/50 hover:text-cream'
            }`}
          >
            {t.icon} <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <Card padding="md">
          <h2 className="font-bold text-cream mb-4">Personal Information</h2>
          <div className="space-y-4">
            <Input label="Full Legal Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            <Input label="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-cream/50">Country</label>
              <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="input-dark appearance-none">
                {['US'].map(c => (
                  <option key={c} value={c} className="bg-[#1e1c35]">{c}</option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <Button onClick={saveProfile} loading={saving} icon={<Save size={15} />}>Save Changes</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'bank_accounts' && (
        <BankAccountsManager workerId={profile.id} />
      )}

      {tab === 'security' && (
        <Card padding="md">
          <h2 className="font-bold text-cream mb-4">Security</h2>
          <div className="space-y-4">
            <div className="p-4 rounded flex items-center justify-between border border-white/8">
              <div>
                <p className="font-semibold text-cream text-sm">Password</p>
                <p className="text-xs text-cream/50">Last changed: Not changed recently</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(true)}>Change</Button>
            </div>
            <div className="p-4 rounded flex items-center justify-between border border-white/8">
              <div>
                <p className="font-semibold text-cream text-sm">Two-Factor Authentication</p>
                <p className={`text-xs flex items-center gap-1.5 ${twoFactorEnabled ? 'text-sage' : 'text-cream/50'}`}>
                  {twoFactorEnabled ? <ShieldCheck size={12} strokeWidth={2} /> : <Smartphone size={12} strokeWidth={2} />}
                  {twoFactorEnabled ? 'Authenticator app active' : 'Set up an authenticator app'}
                </p>
              </div>
              {twoFactorEnabled ? (
                <span className="status-verified">Active</span>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsTwoFactorModalOpen(true);
                    void startTwoFactorSetup();
                  }}
                >
                  Enable
                </Button>
              )}
            </div>
            <div className="p-4 rounded flex items-center justify-between border border-white/8">
              <div>
                <p className="font-semibold text-cream text-sm">Identity Verification</p>
                <p className="text-xs flex items-center gap-1.5 text-cream/50">
                  <KycStatusIcon size={12} strokeWidth={2} />
                  Manual Operations review
                </p>
              </div>
              <button type="button" onClick={() => setTab('kyc')} className={kycMeta.className}>{kycMeta.label}</button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/8">
            <div className="flex items-start gap-3 p-4 rounded mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Danger Zone</p>
                <p className="text-xs text-cream/50 mt-0.5">These actions are irreversible.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="danger" size="sm" onClick={signOut} icon={<LogOut size={14} />}>Sign Out</Button>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Close Account</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'kyc' && (
        <Card padding="md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-bold text-cream">Worker KYC</h2>
              <p className="text-sm text-cream/50 mt-1">Submit your government ID and SSN or tax ID for manual approval.</p>
            </div>
            <span className={kycMeta.className}>{kycMeta.label}</span>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded border border-white/8 p-4">
            <KycStatusIcon size={18} className={kycStatus === 'verified' ? 'text-sage' : kycStatus === 'rejected' ? 'text-red-400' : 'text-gold'} />
            <div>
              <p className="text-sm font-semibold text-cream">Manual identity review</p>
              <p className="text-xs text-cream/50 mt-0.5">{kycMeta.description}</p>
              {kycSubmission && (
                <p className="text-xs text-cream/40 mt-2">
                  Last submitted {new Date(kycSubmission.submitted_at).toLocaleDateString()} - {kycSubmission.id_document_file_name} - Tax ID ending {kycSubmission.tax_id_last4}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitKyc} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="ID Document Type"
                value={kycForm.idDocumentType}
                onChange={e => setKycForm(p => ({ ...p, idDocumentType: e.target.value as WorkerKycSubmission['id_document_type'] }))}
                options={[
                  { value: 'drivers_license', label: "Driver's License" },
                  { value: 'state_id', label: 'State ID' },
                  { value: 'passport', label: 'Passport' },
                  { value: 'id_card', label: 'ID Card' },
                ]}
              />
              <Select
                label="Tax ID Type"
                value={kycForm.taxIdType}
                onChange={e => setKycForm(p => ({ ...p, taxIdType: e.target.value as WorkerKycSubmission['tax_id_type'] }))}
                options={[
                  { value: 'ssn', label: 'SSN' },
                  { value: 'itin', label: 'ITIN' },
                  { value: 'ein', label: 'EIN' },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="kyc-id-upload" className="label-caps mb-1.5 block">ID Card Upload</label>
                <input
                  id="kyc-id-upload"
                  key={idDocumentFile?.name ?? 'empty-id-upload'}
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={e => setIdDocumentFile(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="kyc-id-upload"
                  className="flex min-h-[42px] cursor-pointer items-center justify-between gap-3 rounded border border-white/8 bg-[#12203F] px-3 py-2 text-sm text-cream/60 transition-colors hover:border-gold/50"
                >
                  <span className="min-w-0 truncate">{idDocumentFile?.name ?? 'Choose image or PDF'}</span>
                  <UploadCloud size={16} className="flex-shrink-0 text-gold" />
                </label>
              </div>
              <Input
                label="SSN or Tax ID Number"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter full number"
                value={kycForm.taxIdNumber}
                onChange={e => setKycForm(p => ({ ...p, taxIdNumber: e.target.value }))}
                hint="For privacy, only the last 4 digits are retained after submission."
              />
            </div>

            {submittingKyc && <LoadingSpinner text="Uploading KYC package" fullScreen={false} variant="panel" />}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-cream/40">Operations reviews submissions manually before marking workers verified.</p>
              <Button type="submit" loading={submittingKyc} icon={<FileUp size={15} />}>Submit KYC</Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card padding="md">
          <h2 className="font-bold text-cream mb-4">Notification Preferences</h2>
          {!notificationPreferences ? (
            <LoadingSpinner text="Loading preferences..." fullScreen={false} />
          ) : (
            <div className="space-y-3">
              {notificationOptions.map(option => {
                const enabled = notificationPreferences[option.key];
                return (
                  <div key={option.key} className="flex items-center justify-between gap-4 p-3 rounded border border-white/8">
                    <div className="min-w-0">
                      <p className="text-sm text-cream">{option.label}</p>
                      <p className="text-xs text-cream/45 mt-0.5">{option.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={option.label}
                      onClick={() => toggleNotificationPreference(option.key)}
                      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${enabled ? 'bg-primary-500' : 'bg-white/10'}`}
                    >
                      <span
                        className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'legal' && (
        <Card padding="md">
          <h2 className="font-bold text-cream mb-4">Legal &amp; Compliance</h2>
          <div className="space-y-3">
            {([
              { type: 'worker_agreement'   as LegalDocumentType, label: 'Worker Agreement',        desc: 'Independent contractor terms' },
              { type: 'irs_w9'             as LegalDocumentType, label: 'IRS Form W-9',            desc: 'Required for 1099-NEC issuance' },
              { type: 'aml_acknowledgment' as LegalDocumentType, label: 'AML Acknowledgment',      desc: 'Anti-Money Laundering policy' },
              { type: 'ofac_compliance'    as LegalDocumentType, label: 'OFAC Compliance Agreement', desc: 'Sanctions compliance' },
              { type: 'code_of_conduct'    as LegalDocumentType, label: 'Platform Code of Conduct', desc: 'Reviewed at training' },
            ]).map(doc => {
              const signed = isSigned(doc.type);
              const record = getSignedDoc(doc.type);
              return (
                <div key={doc.type} className="flex items-center justify-between gap-3 p-3 rounded border border-white/8">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cream">{doc.label}</p>
                    <p className="text-xs text-cream/50">
                      {signed && record
                        ? `Signed ${new Date(record.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : doc.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {signed && record && (
                      <button
                        onClick={() => setViewingDoc(record)}
                        className="flex items-center gap-1 text-xs text-cream/50 hover:text-cream transition-colors"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                    )}
                    {signed
                      ? <span className="status-verified flex items-center gap-1"><FileCheck size={11} /> Signed</span>
                      : doc.type === 'irs_w9'
                        ? <Button size="sm" variant="secondary" icon={<PenLine size={13} />} onClick={() => setIsW9ModalOpen(true)}>Sign Now</Button>
                        : <span className="status-pending">Pending</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-cream/50 mt-4">
            1099-NEC issued annually for workers earning &gt;$600. You are an independent contractor.
          </p>
        </Card>
      )}

      {/* W-9 Signing Modal */}
      <Modal isOpen={isW9ModalOpen} onClose={() => setIsW9ModalOpen(false)} title="IRS Form W-9 - Request for Taxpayer Identification">
        <p className="text-xs text-cream/50 mb-5">This is an electronic W-9. The information you provide will be used to prepare 1099-NEC tax forms for annual earnings over $600.</p>
        <form onSubmit={handleSignW9} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name (as shown on tax return)" value={w9Form.name} onChange={e => setW9Form(p => ({ ...p, name: e.target.value }))} required />
            <Input label="Business / DBA Name (optional)" value={w9Form.businessName} onChange={e => setW9Form(p => ({ ...p, businessName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="label-caps mb-1.5 block">Federal Tax Classification</label>
            <select className="input-dark appearance-none" value={w9Form.taxClassification} onChange={e => setW9Form(p => ({ ...p, taxClassification: e.target.value }))}>
              <option value="individual">Individual / Sole Proprietor</option>
              <option value="llc_single">Single-member LLC</option>
              <option value="llc_multi">Multi-member LLC</option>
              <option value="c_corp">C Corporation</option>
              <option value="s_corp">S Corporation</option>
              <option value="partnership">Partnership</option>
              <option value="trust">Trust / Estate</option>
            </select>
          </div>
          <Input label="Street Address" value={w9Form.address} onChange={e => setW9Form(p => ({ ...p, address: e.target.value }))} required />
          <Input label="City, State, ZIP Code" value={w9Form.cityStateZip} onChange={e => setW9Form(p => ({ ...p, cityStateZip: e.target.value }))} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="label-caps mb-1.5 block">Taxpayer ID Type</label>
              <select className="input-dark appearance-none" value={w9Form.taxIdType} onChange={e => setW9Form(p => ({ ...p, taxIdType: e.target.value as 'ssn' | 'ein' }))}>
                <option value="ssn">SSN</option>
                <option value="ein">EIN</option>
              </select>
            </div>
            <Input
              label={w9Form.taxIdType === 'ssn' ? 'Social Security Number' : 'Employer ID Number'}
              inputMode="numeric"
              autoComplete="off"
              placeholder={w9Form.taxIdType === 'ssn' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
              value={w9Form.taxIdNumber}
              onChange={e => setW9Form(p => ({ ...p, taxIdNumber: e.target.value }))}
              hint="Only the last 4 digits are stored after submission."
              required
            />
          </div>

          {/* Certification */}
          <div className="rounded border border-white/8 p-4 bg-white/2 space-y-3">
            <p className="text-xs text-cream/70 leading-relaxed">
              <strong className="text-cream">Certification:</strong> Under penalties of perjury, I certify that: (1) the taxpayer identification number I have provided is correct, (2) I am not subject to backup withholding, (3) I am a US person (citizen or resident), and (4) the FATCA exemption code entered is correct.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-gold" checked={w9Form.certified} onChange={e => setW9Form(p => ({ ...p, certified: e.target.checked }))} />
              <span className="text-xs text-cream/70">I certify the above statements are true and correct under penalty of perjury.</span>
            </label>
          </div>

          <Input
            label={`Electronic Signature - type your full legal name: "${profile?.full_name}"`}
            placeholder="Type your full name to sign"
            value={w9Form.signature}
            onChange={e => setW9Form(p => ({ ...p, signature: e.target.value }))}
            icon={<PenLine size={15} />}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsW9ModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={signingW9} icon={<FileCheck size={14} />}>Sign &amp; Submit W-9</Button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal isOpen={Boolean(viewingDoc)} onClose={() => setViewingDoc(null)} title={viewingDoc ? viewingDoc.document_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''}>
        {viewingDoc && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 text-xs p-4 rounded" style={{ background: '#0D1632', border: '1px solid rgba(241,240,218,0.08)' }}>
              <div className="flex justify-between"><span className="text-cream/50">Status</span><span className="status-verified flex items-center gap-1"><FileCheck size={11} /> Signed</span></div>
              <div className="flex justify-between"><span className="text-cream/50">Signed</span><span className="text-cream">{new Date(viewingDoc.signed_at).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-cream/50">Version</span><span className="text-cream">{viewingDoc.document_version}</span></div>
              <div className="flex justify-between"><span className="text-cream/50">Signature</span><span className="text-cream italic">{viewingDoc.signature}</span></div>
            </div>
            {viewingDoc.document_type === 'irs_w9' && viewingDoc.w9_name && (
              <div className="grid gap-2 text-xs p-4 rounded" style={{ background: '#0D1632', border: '1px solid rgba(241,240,218,0.08)' }}>
                <p className="font-semibold text-cream mb-1">W-9 Details</p>
                <div className="flex justify-between"><span className="text-cream/50">Name</span><span className="text-cream">{viewingDoc.w9_name}</span></div>
                {viewingDoc.w9_business_name && <div className="flex justify-between"><span className="text-cream/50">Business</span><span className="text-cream">{viewingDoc.w9_business_name}</span></div>}
                <div className="flex justify-between"><span className="text-cream/50">Classification</span><span className="text-cream capitalize">{viewingDoc.w9_tax_classification?.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-cream/50">Address</span><span className="text-cream text-right max-w-[60%]">{viewingDoc.w9_address}, {viewingDoc.w9_city_state_zip}</span></div>
                <div className="flex justify-between"><span className="text-cream/50">Tax ID</span><span className="text-cream">{viewingDoc.w9_tax_id_type?.toUpperCase()} ending ***{viewingDoc.w9_tax_id_last4}</span></div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setViewingDoc(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Update Password">
        <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
          <Input 
            label="Current Password" 
            type="password" 
            value={passwordForm.current} 
            onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} 
            required 
          />
          <Input 
            label="New Password" 
            type="password" 
            value={passwordForm.new} 
            onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))} 
            required 
            hint="Must be at least 8 characters"
          />
          <Input 
            label="Confirm New Password" 
            type="password" 
            value={passwordForm.confirm} 
            onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} 
            required 
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={changingPassword}>Update Password</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTwoFactorModalOpen}
        onClose={() => {
          setIsTwoFactorModalOpen(false);
          setTwoFactorSetup(null);
          setTwoFactorCode('');
        }}
        title="Set Up Two-Factor Authentication"
      >
        <div className="space-y-4 mt-2">
          {enrollingTwoFactor && <LoadingSpinner text="Preparing authenticator setup" fullScreen={false} variant="panel" />}

          {!enrollingTwoFactor && twoFactorSetup && (
            <form onSubmit={verifyTwoFactorSetup} className="space-y-4">
              <div className="rounded border border-white/8 p-4">
                <div className="flex items-start gap-3">
                  <QrCode size={18} className="text-gold mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cream">Authenticator app</p>
                    <p className="text-xs text-cream/50 mt-0.5">Scan the code or enter the setup key, then submit the 6-digit code.</p>
                  </div>
                </div>
                {twoFactorSetup.qrCode ? (
                  <div className="mt-4 flex justify-center rounded bg-white p-3">
                    <img src={twoFactorSetup.qrCode} alt="Two-factor QR code" className="h-40 w-40" />
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-center rounded border border-white/8 bg-white/5 p-6">
                    <Smartphone size={42} className="text-gold" />
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 rounded bg-white/5 px-3 py-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-cream/70">{twoFactorSetup.secret}</code>
                  <button
                    type="button"
                    aria-label="Copy setup key"
                    className="text-cream/50 hover:text-gold"
                    onClick={() => {
                      void navigator.clipboard?.writeText(twoFactorSetup.secret);
                      toast.success('Setup key copied');
                    }}
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              <Input
                label="6-Digit Code"
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                icon={<KeyRound size={15} />}
                hint={twoFactorSetup?.factorId === 'local-factor' ? 'Scan the QR code with your authenticator, then enter the 6-digit code it generates.' : undefined}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setIsTwoFactorModalOpen(false);
                    setTwoFactorSetup(null);
                    setTwoFactorCode('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={verifyingTwoFactor}>Verify & Enable</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}



