import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Mail, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getMyApplication } from '../lib/applicationData';
import type { WorkerApplication } from '../types/database';
import { formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.5)';
const GOLD = '#C9A84C';
const SAGE = '#7DC99A';
const TERRA = '#C8523D';

const statusConfig = {
  pending: {
    Icon: Clock,
    title: 'Application Received',
    badge: 'Pending Review',
    color: GOLD,
    copy: 'Your email is verified and your worker application is waiting for admin review. We will update this page as soon as Operations makes a decision.',
  },
  in_review: {
    Icon: RefreshCw,
    title: 'Application In Review',
    badge: 'In Review',
    color: GOLD,
    copy: 'Operations is reviewing your account details, banking capability, and worker profile. Keep an eye on this page for the final decision.',
  },
  approved: {
    Icon: CheckCircle,
    title: 'Account Approved',
    badge: 'Verified',
    color: SAGE,
    copy: 'Your worker account has been verified. Continue onboarding so you can complete training and access eligible gigs.',
  },
  rejected: {
    Icon: XCircle,
    title: 'Application Not Approved',
    badge: 'Not Approved',
    color: TERRA,
    copy: 'Operations could not approve this application. Review any notes below or contact support if you believe this needs another look.',
  },
};

export function ApplicationStatusPage() {
  const { profile, isLoading, signOut } = useAuth();
  const [application, setApplication] = useState<WorkerApplication | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    getMyApplication().then(data => {
      if (!cancelled) {
        setApplication(data);
        setFetching(false);
      }
    });
    return () => { cancelled = true; };
  }, [profile?.id]);

  if (isLoading || fetching) return null;

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="w-14 h-14 rounded mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <AlertCircle size={28} strokeWidth={1.5} style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>No Application Found</h1>
          <p className="text-sm mb-6" style={{ color: DIM }}>
            We could not find a worker application attached to this account yet.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/apply"><Button>Start Application</Button></Link>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  const config = statusConfig[application.status];
  const Icon = config.Icon;
  const isApproved = application.status === 'approved';
  const timeline = [
    { label: 'Application submitted', done: true, detail: formatDate(application.submitted_at) },
    { label: 'Email verified', done: true, detail: 'Complete' },
    { label: 'Admin review', done: application.status !== 'pending', detail: application.status === 'pending' ? 'Waiting' : application.status.replace('_', ' ') },
    { label: 'Account verification', done: isApproved, detail: isApproved ? 'Approved' : 'Pending' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}18`, border: `1px solid ${config.color}45` }}>
              <Icon size={28} strokeWidth={1.5} style={{ color: config.color }} />
            </div>
            <div>
              <p className="section-label mb-1">Worker Application</p>
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{config.title}</h1>
              <p className="text-sm mt-2 leading-relaxed max-w-xl" style={{ color: DIM }}>{config.copy}</p>
            </div>
          </div>
          <span className={application.status === 'approved' ? 'status-verified' : application.status === 'rejected' ? 'status-failed' : 'status-pending'}>
            {config.badge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7 pt-6 border-t border-white/8">
          {[
            ['Applicant', application.full_name],
            ['Submitted', formatDate(application.submitted_at)],
            ['Primary bank', application.bank],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="label-caps mb-1">{label}</p>
              <p className="text-sm font-semibold" style={{ color: CREAM }}>{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h2 className="font-bold text-sm mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM, letterSpacing: '0.04em' }}>Review Timeline</h2>
        <div className="space-y-3">
          {timeline.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                {item.done ? <CheckCircle size={15} style={{ color: SAGE }} /> : <Clock size={15} style={{ color: GOLD }} />}
                <span className="text-sm" style={{ color: CREAM }}>{item.label}</span>
              </div>
              <span className="text-xs text-right" style={{ color: DIM }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      {application.notes && (
        <Card padding="md">
          <h2 className="font-bold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM, letterSpacing: '0.04em' }}>Review Notes</h2>
          <p className="text-sm leading-relaxed" style={{ color: DIM }}>{application.notes}</p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button variant="secondary" onClick={signOut}>Sign Out</Button>
        {isApproved ? (
          <Link to={profile?.onboarding_completed ? '/dashboard' : '/onboarding/profile'}>
            <Button icon={<CheckCircle size={15} />}>Continue</Button>
          </Link>
        ) : (
          <Link to="/support">
            <Button variant="outline" icon={<Mail size={15} />}>Contact Support</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
