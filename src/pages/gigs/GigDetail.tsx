import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RiSearchLine, RiFileListLine } from 'react-icons/ri';
import { useAuth } from '../../hooks/useAuth';
import { useGigs, GigDetailRecord } from '../../hooks/useGigs';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BadgeIcon } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FundingBanner } from '../../components/ui/FundingBanner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RecipientCard } from '../../components/gigs/RecipientCard';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ArrowLeft, CheckCircle, FileCheck2, FileUp, MessageCircle, X } from 'lucide-react';
import { WorkerDisbursement } from '../../types/database';
import { MessageInputBar, Attachment } from '../../components/ui/MessageInputBar';
import { useSmartBack } from '../../hooks/useSmartBack';

const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.45)';
const GOLD = '#C9A84C';
const SAGE = '#7DC99A';
const BORDER = 'rgba(241,240,218,0.09)';
const NAVY8 = '#12203F';

export function GigDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { profile } = useAuth();
  const goBack = useSmartBack('/gigs/available');
  const { loading, gigs, applyToGig, confirmFunding, sendMessage, submitProof, getGigDetails } = useGigs(profile?.id);
  const [detail, setDetail] = useState<GigDetailRecord | null>(null);
  const [mobileView, setMobileView] = useState<'details' | 'operations'>('details');
  const [applyNote, setApplyNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [chatBody, setChatBody] = useState('');
  const [proofTarget, setProofTarget] = useState<WorkerDisbursement | null>(null);
  const [proofTxid, setProofTxid] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDetail(getGigDetails(id));
  }, [id, gigs]);

  useEffect(() => {
    if (location.hash === '#operations') {
      setMobileView('operations');
    }
  }, [location.hash]);

  if (loading) return <LoadingSpinner text="Loading gig details..." />;
  if (!detail) return (
    <div className="text-center py-20">
      <RiSearchLine style={{ fontSize: 40, margin: '0 auto 12px', color: 'rgba(241,240,218,0.3)' }} />
      <p className="text-cream font-bold">Gig not found</p>
      <button type="button" onClick={goBack} className="text-gold text-sm mt-2 hover:underline">Back</button>
    </div>
  );

  const { gig, application, disbursements, thread, messages } = detail;
  const isAssigned = gig.worker_id === profile?.id;
  const hasOperationsRoom = isAssigned && Boolean(thread);
  const canApply = gig.status === 'open' && !application;
  const canConfirmFunding = isAssigned && gig.funded && gig.funding_status === 'funded';
  const canSubmitProof = isAssigned && ['funding_confirmed', 'disbursement_in_progress', 'proof_rejected'].includes(gig.funding_status ?? 'unfunded');
  const sentCount = disbursements.filter(d => ['sent', 'verified'].includes(d.status)).length;
  const verifiedCount = disbursements.filter(d => d.status === 'verified').length;
  const progress = disbursements.length > 0 ? (verifiedCount / disbursements.length) * 100 : 0;

  async function handleApply() {
    if (!profile) return;
    setApplying(true);
    try {
      await applyToGig(gig.id, applyNote);
      toast.success('Application submitted for moderator review');
      setApplyNote('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit application');
    } finally {
      setApplying(false);
    }
  }

  async function handleConfirmFunding() {
    try {
      await confirmFunding(gig.id);
      toast.success('Funding availability confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not confirm funding');
    }
  }

  async function handleSendMessage(attachments: Attachment[]) {
    if (!thread || !profile || (!chatBody.trim() && attachments.length === 0)) return;
    let body = chatBody.trim();
    if (attachments.length > 0) {
      const names = attachments.map(a => a.file.name).join(', ');
      body = body ? `${body} [Attached: ${names}]` : `[Attached: ${names}]`;
    }
    await sendMessage(thread.id, profile.full_name, body);
    setChatBody('');
  }

  async function handleSubmitProof() {
    if (!proofTarget || !proofTxid.trim()) return;
    setSubmittingProof(true);
    try {
      await submitProof(proofTarget.id, proofTxid.trim(), proofFile);
      toast.success('Proof submitted for Operations verification');
      closeProofModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit proof');
    } finally {
      setSubmittingProof(false);
    }
  }

  function openProofModal(disbursement: WorkerDisbursement) {
    setProofTarget(disbursement);
    setProofTxid(disbursement.transaction_id ?? '');
    setProofFile(null);
  }

  function closeProofModal() {
    setProofTarget(null);
    setProofTxid('');
    setProofFile(null);
    setSubmittingProof(false);
  }

  function showMobileView(view: 'details' | 'operations') {
    setMobileView(view);
    if (view === 'operations') {
      window.history.replaceState(null, '', `${location.pathname}${location.search}#operations`);
    } else {
      window.history.replaceState(null, '', `${location.pathname}${location.search}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-cream transition-colors">
        <ArrowLeft size={16} /> Back to Gigs
      </button>

      {hasOperationsRoom && (
        <div className="grid grid-cols-2 gap-1 rounded border border-cream/10 bg-navy-900 p-1 sm:hidden">
          <button
            type="button"
            onClick={() => showMobileView('details')}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileView === 'details' ? 'bg-gold text-navy-950' : 'text-cream/60 hover:text-cream'
            }`}
          >
            <RiFileListLine size={15} /> Details
          </button>
          <button
            type="button"
            onClick={() => showMobileView('operations')}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded px-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mobileView === 'operations' ? 'bg-gold text-navy-950' : 'text-cream/60 hover:text-cream'
            }`}
          >
            <MessageCircle size={15} /> Operations
          </button>
        </div>
      )}

      <Card padding="lg" id="overview" className={`scroll-mt-24 ${hasOperationsRoom && mobileView === 'operations' ? 'hidden sm:block' : ''}`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-cream">{gig.client_name}</h1>
            {gig.client_contact && <p className="text-sm text-cream/50">{gig.client_contact}</p>}
          </div>
          <span className={`status-${gig.status}`}>{gig.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
          {[
            { label: 'Total Principal', value: formatCurrency(gig.total_principal), highlight: true },
            { label: `Worker Fee (${gig.commission_rate}%)`, value: formatCurrency(gig.commission_amount), earn: true },
            { label: 'Recipients', value: `${gig.recipient_count} people` },
            { label: 'Deadline', value: formatDate(gig.deadline) },
          ].map(({ label, value, highlight, earn }) => (
            <div key={label}>
              <p className="text-xs text-cream/50 mb-1">{label}</p>
              <p className={`font-bold ${earn ? 'text-sage' : highlight ? 'text-gold/80' : 'text-cream'}`}>{value}</p>
            </div>
          ))}
        </div>

        {gig.badge_required && (
          <div className="flex items-center gap-2 mb-4 text-sm text-cream/50">
            Requires: <BadgeIcon tier={gig.badge_required} size="sm" />
          </div>
        )}

        {gig.notes && (
          <div className="p-3 rounded-xl mb-4 text-sm text-cream/50" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {gig.notes}
          </div>
        )}

        <FundingBanner totalPrincipal={gig.total_principal} funded={gig.funded} />

        <div className="mt-5 flex flex-wrap gap-3">
          {canApply && (
            <Button onClick={handleApply} loading={applying} icon={<CheckCircle size={16} />}>
              Apply for Gig
            </Button>
          )}
          {application && !isAssigned && (
            <div className="text-sm font-semibold" style={{ color: GOLD }}>
              Application status: {application.status.replace(/_/g, ' ')}
            </div>
          )}
          {canConfirmFunding && (
            <Button onClick={handleConfirmFunding} icon={<CheckCircle size={16} />}>
              Confirm Funds Available
            </Button>
          )}
          {isAssigned && !gig.funded && (
            <Button variant="secondary" disabled>Awaiting Operations Funding</Button>
          )}
          {gig.status === 'completed' && (
            <div className="flex items-center gap-2 text-sage text-sm font-semibold">
              <CheckCircle size={18} /> Gig Completed - records updated
            </div>
          )}
        </div>

        {canApply && (
          <div id="apply" className="mt-5 scroll-mt-24">
            <label className="label-caps block mb-2">Application Note</label>
            <textarea
              value={applyNote}
              onChange={e => setApplyNote(e.target.value)}
              className="input-dark resize-none"
              rows={3}
              placeholder="Mention availability, relevant experience, or account readiness..."
            />
          </div>
        )}
      </Card>

      {isAssigned && (
        <Card padding="md" id="status" className={`scroll-mt-24 ${hasOperationsRoom && mobileView === 'operations' ? 'hidden sm:block' : ''}`}>
          <h2 className="font-bold text-cream mb-3">Transaction Status</h2>
          <ProgressBar value={verifiedCount} max={Math.max(disbursements.length, 1)} showPercent color="green" />
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <div><p className="label-caps">Funding</p><p style={{ color: CREAM }}>{(gig.funding_status ?? 'unfunded').replace(/_/g, ' ')}</p></div>
            <div><p className="label-caps">Sent</p><p style={{ color: CREAM }}>{sentCount}/{disbursements.length}</p></div>
            <div><p className="label-caps">Verified</p><p style={{ color: CREAM }}>{verifiedCount}/{disbursements.length}</p></div>
          </div>
          {progress === 0 && <p className="text-xs mt-3" style={{ color: DIM }}>Proof submission unlocks after you confirm the principal funds are visible in your dedicated account.</p>}
        </Card>
      )}

      {isAssigned && thread && (
        <Card padding="md" id="operations" className={`scroll-mt-24 ${hasOperationsRoom && mobileView === 'details' ? 'hidden sm:block' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-cream flex items-center gap-2"><MessageCircle size={16} /> Operations Room</h2>
            <span className="text-xs" style={{ color: DIM }}>{thread.specialist_name}, Operations Specialist</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {messages.map(message => (
              <div key={message.id} className="p-3 rounded" style={{ background: message.sender_role === 'worker' ? 'rgba(201,168,76,0.08)' : NAVY8, border: `1px solid ${BORDER}` }}>
                <div className="flex justify-between gap-3 mb-1">
                  <p className="text-xs font-bold" style={{ color: message.sender_role === 'worker' ? GOLD : SAGE }}>{message.sender_name}</p>
                  <p className="text-xs" style={{ color: DIM }}>{formatDate(message.created_at)}</p>
                </div>
                <p className="text-sm" style={{ color: CREAM }}>{message.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <MessageInputBar
              value={chatBody}
              onChange={setChatBody}
              onSend={handleSendMessage}
              placeholder="Message Operations..."
              disabled={!thread || !profile}
            />
          </div>
        </Card>
      )}

      <Card padding="md" id="beneficiaries" className={`scroll-mt-24 ${hasOperationsRoom && mobileView === 'operations' ? 'hidden sm:block' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-cream">Beneficiaries <span className="text-cream/50 font-normal text-sm">({disbursements.length}/{gig.recipient_count})</span></h2>
        </div>
        {disbursements.length === 0 ? (
          <div className="text-center py-8">
            <RiFileListLine style={{ fontSize: 36, margin: '0 auto 8px', color: 'rgba(241,240,218,0.3)' }} />
            <p className="text-sm text-cream/50">Beneficiary instructions will appear here after Operations assigns them.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disbursements.map(d => (
              <div key={d.id}>
                <RecipientCard disbursement={d} />
                {canSubmitProof && ['pending', 'proof_rejected'].includes(d.status) && (
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="secondary" icon={<FileUp size={14} />} onClick={() => openProofModal(d)}>
                      Submit Proof
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={Boolean(proofTarget)} onClose={closeProofModal} title="Submit Disbursement Proof">
        {proofTarget && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded" style={{ background: NAVY8, border: `1px solid ${BORDER}` }}>
                <p className="label-caps mb-1">Recipient</p>
                <p className="font-bold text-sm truncate" style={{ color: CREAM }}>{proofTarget.recipient_name}</p>
              </div>
              <div className="p-3 rounded" style={{ background: NAVY8, border: `1px solid ${BORDER}` }}>
                <p className="label-caps mb-1">Amount Sent</p>
                <p className="font-bold text-sm" style={{ color: GOLD }}>{formatCurrency(proofTarget.amount)}</p>
              </div>
              <div className="p-3 rounded" style={{ background: NAVY8, border: `1px solid ${BORDER}` }}>
                <p className="label-caps mb-1">Method</p>
                <p className="font-bold text-sm capitalize truncate" style={{ color: CREAM }}>{proofTarget.method.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="p-3 rounded text-sm" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.22)', color: CREAM }}>
              <p className="font-semibold">Confirm the transfer is complete before submitting proof.</p>
              <p className="text-xs mt-1" style={{ color: DIM }}>Destination: {proofTarget.destination}</p>
            </div>

            <Input
              label="Transaction ID / Reference"
              value={proofTxid}
              onChange={e => setProofTxid(e.target.value)}
              placeholder="Enter the bank, Zelle, Cash App, or wire reference"
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="label-caps block">Proof file</label>
              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center transition-colors"
                style={{ background: NAVY8, border: `1px dashed ${proofFile ? 'rgba(125,201,154,0.45)' : BORDER}`, borderRadius: 4 }}
              >
                {proofFile ? <FileCheck2 size={24} color={SAGE} /> : <FileUp size={24} color={GOLD} />}
                <span className="font-bold text-sm" style={{ color: CREAM }}>
                  {proofFile ? proofFile.name : 'Attach screenshot or PDF proof'}
                </span>
                <span className="text-xs" style={{ color: DIM }}>
                  PNG, JPG, or PDF. Include the completed transfer screen when available.
                </span>
                <input className="sr-only" type="file" accept="image/png,image/jpeg,application/pdf" onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
              </label>
              {proofFile && (
                <button type="button" className="btn-ghost !px-0 !py-1 text-xs" onClick={() => setProofFile(null)}>
                  <X size={13} /> Remove file
                </button>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={closeProofModal}>Cancel</Button>
              <Button className="flex-1" disabled={!proofTxid.trim()} loading={submittingProof} onClick={handleSubmitProof}>
                Submit Proof
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
