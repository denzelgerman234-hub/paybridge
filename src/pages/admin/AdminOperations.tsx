import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RiArrowLeftLine, RiBriefcaseLine, RiCheckboxCircleLine, RiMessage2Line, RiTimeLine, RiCloseLine } from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import { subscribeToTableRefresh } from '../../lib/realtime';
import { formatCurrency, formatDate, formatRelativeTime } from '../../lib/utils';
import { MessageInputBar, Attachment } from '../../components/ui/MessageInputBar';
import { OperationMessage, OperationThread, WorkerDisbursement, WorkerGig, WorkerProfile } from '../../types/database';
import { DISBURSEMENT_METHODS } from '../../lib/constants';
import { sendWorkerNotification } from '../../lib/notificationDelivery';

type BeneficiaryForm = Pick<WorkerDisbursement, 'recipient_name' | 'amount' | 'method' | 'destination'>;
function emptyBeneficiary(): BeneficiaryForm {
  return { recipient_name: '', amount: 0, method: 'bank_transfer', destination: '' };
}
const MAX_BENEFICIARIES = 5;

type OperationRoom = OperationThread & {
  gig: WorkerGig | null;
  worker: WorkerProfile | null;
  messages: OperationMessage[];
  disbursements: WorkerDisbursement[];
};

const BORDER = 'rgba(241,240,218,0.09)';
const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.50)';
const GOLD = '#C9A84C';

function normalizeGig(row: any): WorkerGig {
  return {
    ...row,
    total_principal: Number(row.total_principal ?? 0),
    commission_rate: Number(row.commission_rate ?? 0),
    commission_amount: Number(row.commission_amount ?? 0),
    recipient_count: Number(row.recipient_count ?? 0),
    disbursement_methods: Array.isArray(row.disbursement_methods) ? row.disbursement_methods : [],
    funded: Boolean(row.funded),
  } as WorkerGig;
}

function normalizeWorker(row: any): WorkerProfile {
  return {
    ...row,
    total_gigs_completed: Number(row.total_gigs_completed ?? 0),
    total_disbursed: Number(row.total_disbursed ?? 0),
    total_earned: Number(row.total_earned ?? 0),
    rating: Number(row.rating ?? 0),
  } as WorkerProfile;
}

function normalizeDisbursement(row: any): WorkerDisbursement {
  return { ...row, amount: Number(row.amount ?? 0) } as WorkerDisbursement;
}

function throwIfError(error: any) {
  if (error) throw error;
}

export function AdminOperations() {
  const [rooms, setRooms] = useState<OperationRoom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'rooms' | 'detail'>('rooms');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Post-funding beneficiary assignment
  const [showBeneficiariesForm, setShowBeneficiariesForm] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryForm[]>([]);
  const [savingBeneficiaries, setSavingBeneficiaries] = useState(false);

  async function refresh(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [threadsResult, gigsResult, workersResult, messagesResult, disbursementsResult] = await Promise.all([
        supabase.from('operation_threads').select('*').order('updated_at', { ascending: false }),
        supabase.from('worker_gigs').select('*'),
        supabase.from('worker_profiles').select('*'),
        supabase.from('operation_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('worker_disbursements').select('*').order('created_at', { ascending: true }),
      ]);

      throwIfError(threadsResult.error);
      throwIfError(gigsResult.error);
      throwIfError(workersResult.error);
      throwIfError(messagesResult.error);
      throwIfError(disbursementsResult.error);

      const gigs: WorkerGig[] = (gigsResult.data ?? []).map((row: any) => normalizeGig(row));
      const workers: WorkerProfile[] = (workersResult.data ?? []).map((row: any) => normalizeWorker(row));
      const messages = (messagesResult.data ?? []) as OperationMessage[];
      const disbursements: WorkerDisbursement[] = (disbursementsResult.data ?? []).map((row: any) => normalizeDisbursement(row));
      const gigById = new Map(gigs.map(gig => [gig.id, gig]));
      const workerById = new Map(workers.map(worker => [worker.id, worker]));
      const messagesByThread = new Map<string, OperationMessage[]>();
      const disbursementsByGig = new Map<string, WorkerDisbursement[]>();

      messages.forEach(item => {
        const group = messagesByThread.get(item.thread_id) ?? [];
        group.push(item);
        messagesByThread.set(item.thread_id, group);
      });
      disbursements.forEach(item => {
        const group = disbursementsByGig.get(item.gig_id) ?? [];
        group.push(item);
        disbursementsByGig.set(item.gig_id, group);
      });

      const nextRooms = ((threadsResult.data ?? []) as OperationThread[]).map(thread => ({
        ...thread,
        gig: gigById.get(thread.gig_id) ?? null,
        worker: workerById.get(thread.worker_id) ?? null,
        messages: messagesByThread.get(thread.id) ?? [],
        disbursements: disbursementsByGig.get(thread.gig_id) ?? [],
      }));

      setRooms(nextRooms);
      
      const newSelected = nextRooms.find(r => r.id === (selectedId ?? nextRooms[0]?.id));
      setSelectedId(newSelected?.id ?? null);
      
      // Auto-hide beneficiaries form if room changed or disbursements were added
      if (!newSelected || newSelected.disbursements.length > 0 || newSelected.gig?.funding_status !== 'funding_confirmed') {
        setShowBeneficiariesForm(false);
        setBeneficiaries([]);
      }
    } catch (error) {
      console.error('[paybridge] Failed to load operations rooms', error);
      toast.error(error instanceof Error ? error.message : 'Could not load operations rooms');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    return subscribeToTableRefresh(
      'admin-operation-threads',
      [
        { table: 'operation_threads' },
        { table: 'operation_messages' },
        { table: 'worker_disbursements' },
      ],
      () => { void refresh(false); },
    );
  }, []);

  const selected = useMemo(() => rooms.find(room => room.id === selectedId) ?? rooms[0] ?? null, [rooms, selectedId]);
  const activeRooms = rooms.filter(room => room.status === 'open').length;
  const totalMessages = rooms.reduce((sum, room) => sum + room.messages.length, 0);
  const awaitingProof = rooms.reduce((count, room) => count + room.disbursements.filter(d => d.status === 'sent').length, 0);

  async function sendMessage(attachments: Attachment[]) {
    if (!selected || (!message.trim() && attachments.length === 0)) return;
    setSending(true);
    try {
      let body = message.trim();
      if (attachments.length > 0) {
        const names = attachments.map(a => a.file.name).join(', ');
        body = body ? `${body} [Attached: ${names}]` : `[Attached: ${names}]`;
      }
      const { error } = await supabase.from('operation_messages').insert({
        thread_id: selected.id,
        sender_role: 'operations',
        sender_name: selected.specialist_name || 'Operations',
        body,
      });
      throwIfError(error);

      const { error: updateError } = await supabase
        .from('operation_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selected.id);
      throwIfError(updateError);

      setMessage('');
      await refresh();
      toast.success('Message sent');
    } catch (error) {
      console.error('[paybridge] Failed to send operations message', error);
      toast.error(error instanceof Error ? error.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  function openRoom(roomId: string) {
    if (roomId !== selectedId) {
      setShowBeneficiariesForm(false);
      setBeneficiaries([]);
    }
    setSelectedId(roomId);
    setMobileView('detail');
  }

  // ── Post-funding beneficiary helpers ──────────────────────────────────────

  async function loadDraftBeneficiaries() {
    if (!selected?.gig) return;
    const { data } = await supabase
      .from('gig_beneficiaries')
      .select('*')
      .eq('gig_id', selected.gig.id)
      .order('created_at', { ascending: true });
    
    const drafts = (data ?? []) as any[];
    setBeneficiaries(
      drafts.length > 0
        ? drafts.map(d => ({ recipient_name: d.recipient_name, amount: d.amount, method: d.method, destination: d.destination }))
        : [emptyBeneficiary()]
    );
    setShowBeneficiariesForm(true);
  }

  async function saveBeneficiaries() {
    if (!selected?.gig || !selected.worker) return;
    const gig = selected.gig;

    const clean = beneficiaries
      .map(b => ({ ...b, recipient_name: b.recipient_name.trim(), destination: b.destination.trim(), amount: Number(b.amount) || 0 }))
      .filter(b => b.recipient_name && b.destination && b.amount > 0);

    if (clean.length === 0) { toast.error('Add at least one complete beneficiary row'); return; }
    if (clean.some(b => !b.recipient_name || !b.destination || !b.amount)) {
      toast.error('Complete all fields for each beneficiary'); return;
    }

    setSavingBeneficiaries(true);
    try {
      const { error: deleteError } = await supabase.from('gig_beneficiaries').delete().eq('gig_id', gig.id);
      throwIfError(deleteError);

      const { error: insertError } = await supabase.from('gig_beneficiaries').insert(
        clean.map(b => ({ gig_id: gig.id, recipient_name: b.recipient_name, amount: b.amount, method: b.method, destination: b.destination }))
      );
      throwIfError(insertError);

      const { error: materializeError } = await supabase.rpc('materialize_beneficiaries', { p_gig_id: gig.id, p_worker_id: selected.worker.id });
      if (materializeError && !materializeError.message?.includes('function')) {
         // Fallback to manual materialization if RPC not present yet
         const rows = clean.map(item => ({
            gig_id: gig.id,
            worker_id: selected.worker!.id,
            recipient_name: item.recipient_name,
            amount: Number(item.amount),
            method: item.method,
            destination: item.destination,
            status: 'pending',
            transaction_id: null,
            proof_url: null,
            notes: null,
          }));
          const { error } = await supabase.from('worker_disbursements').insert(rows);
          throwIfError(error);
      } else if (materializeError) {
         throwIfError(materializeError);
      }

      const { error: gigError } = await supabase.from('worker_gigs').update({ funding_status: 'disbursement_in_progress' }).eq('id', gig.id);
      throwIfError(gigError);

      await sendWorkerNotification({
        workerId: gig.worker_id!,
        kind: 'disbursement_update',
        title: 'Disbursement recipients are ready',
        body: `${gig.client_name}: your recipient instructions are set. Open the gig to begin disbursements.`,
        href: `/gigs/${gig.id}`,
      });

      setShowBeneficiariesForm(false);
      setBeneficiaries([]);
      await refresh(false);
      toast.success('Beneficiaries sent to worker');
    } catch (error) {
      console.error('[paybridge] Failed to save beneficiaries', error);
      toast.error(error instanceof Error ? error.message : 'Could not save beneficiaries');
    } finally {
      setSavingBeneficiaries(false);
    }
  }

  function renderRoomList() {
    return (
      <div className="card overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-8 text-center text-cream/50">{loading ? 'Loading operations rooms...' : 'No operations rooms yet. Accept a gig application to open one.'}</div>
        ) : rooms.map(room => {
          const last = room.messages[room.messages.length - 1];
          const verified = room.disbursements.filter(d => d.status === 'verified').length;
          return (
            <button key={room.id} onClick={() => openRoom(room.id)} className="w-full text-left p-4 border-b hover:bg-white/5 transition-colors" style={{ borderColor: BORDER, background: selected?.id === room.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: CREAM }}>{room.gig?.client_name ?? 'Gig coordination'}</p>
                  <p className="text-xs mt-0.5" style={{ color: DIM }}>{room.worker?.full_name ?? 'Worker'} - {formatRelativeTime(room.updated_at)}</p>
                </div>
                <span className={`status-${room.gig?.status ?? 'open'}`}>{(room.gig?.status ?? room.status).replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: DIM }}>
                <span className="flex items-center gap-1"><RiBriefcaseLine /> {room.gig ? formatCurrency(room.gig.total_principal) : '-'}</span>
                <span className="flex items-center gap-1"><RiCheckboxCircleLine /> {verified}/{room.disbursements.length} verified</span>
              </div>
              <p className="text-xs mt-2 line-clamp-2" style={{ color: DIM }}>{last?.body ?? 'No messages yet'}</p>
            </button>
          );
        })}
      </div>
    );
  }

  function renderRoomDetail() {
    if (!selected) {
      return <div className="card p-8 text-center text-cream/50">Select an operations room</div>;
    }

    return (
      <div className="card p-4 sm:p-5 flex flex-col">
        <button
          type="button"
          onClick={() => setMobileView('rooms')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cream/55 hover:text-cream lg:hidden"
        >
          <RiArrowLeftLine size={15} /> Rooms
        </button>

        <div className="border-b pb-4 mb-4" style={{ borderColor: BORDER }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label mb-1">Operations</p>
              <h2 className="text-xl font-black text-cream">{selected.gig?.client_name ?? 'Gig coordination'}</h2>
              <p className="text-xs text-cream/50 mt-1">{selected.worker?.full_name ?? 'Worker'} - {selected.specialist_name}</p>
            </div>
            <span className={`status-${selected.gig?.status ?? selected.status}`}>{(selected.gig?.status ?? selected.status).replace(/_/g, ' ')}</span>
          </div>
          {selected.gig && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div><p className="label-caps">Principal</p><p className="font-bold text-cream">{formatCurrency(selected.gig.total_principal)}</p></div>
              <div><p className="label-caps">Worker Fee</p><p className="font-bold text-gold">{formatCurrency(selected.gig.commission_amount)}</p></div>
              <div><p className="label-caps">Deadline</p><p className="font-bold text-cream">{formatRelativeTime(selected.gig.deadline)}</p></div>
              <div><p className="label-caps">Funding</p><p className="font-bold text-cream capitalize">{(selected.gig.funding_status ?? 'unfunded').replace(/_/g, ' ')}</p></div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex flex-col min-h-[360px]">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {selected.messages.map(item => {
                const isOps = item.sender_role === 'operations';
                return (
                  <div key={item.id} className={`flex ${isOps ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded p-3 text-sm ${isOps ? 'bg-gold text-[#0B132F]' : 'bg-white/10 text-cream'}`}>
                      <p className="text-[11px] font-semibold opacity-70 mb-1">{item.sender_name} - {formatRelativeTime(item.created_at)}</p>
                      <p className="whitespace-pre-wrap">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 mt-4 border-t" style={{ borderColor: BORDER }}>
              <MessageInputBar
                value={message}
                onChange={setMessage}
                onSend={sendMessage}
                placeholder="Message the worker..."
                disabled={!selected || sending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-cream"><RiMessage2Line /> Beneficiary Status</div>
            
            {/* Show Add Beneficiaries prompt if gig is funding_confirmed and has no disbursements */}
            {selected.gig?.funding_status === 'funding_confirmed' && selected.disbursements.length === 0 && !showBeneficiariesForm && (
              <div className="p-4 rounded border border-gold/30 bg-gold/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-gold">Ready for Disbursment Instructions</p>
                  <p className="text-xs text-cream/60 mt-0.5">Worker has confirmed receipt of funds. Add recipients now.</p>
                </div>
                <button 
                  onClick={loadDraftBeneficiaries}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-gold text-[#0B132F] hover:bg-gold/80 transition-colors whitespace-nowrap"
                >
                  Add Beneficiaries
                </button>
              </div>
            )}

            {showBeneficiariesForm && (
              <div className="p-4 rounded border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-cream">Add Disbursement Recipients</p>
                  <button onClick={() => setShowBeneficiariesForm(false)} className="text-cream/50 hover:text-cream text-xs">Cancel</button>
                </div>
                
                {beneficiaries.map((b, index) => (
                  <div key={index} className="rounded border border-white/8 p-3 space-y-2 bg-[#0B132F]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-cream">Recipient {index + 1}</p>
                      <button type="button" className="text-cream/45 hover:text-cream" onClick={() => setBeneficiaries(prev => prev.filter((_, i) => i !== index))} aria-label="Remove">
                        <RiCloseLine size={15} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className="input-dark" value={b.recipient_name} onChange={e => setBeneficiaries(prev => prev.map((item, i) => i === index ? { ...item, recipient_name: e.target.value } : item))} placeholder="Recipient name" />
                      <input className="input-dark" type="number" min={0} value={b.amount || ''} onChange={e => setBeneficiaries(prev => prev.map((item, i) => i === index ? { ...item, amount: +e.target.value } : item))} placeholder="Amount" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-2">
                      <select className="input-dark appearance-none text-xs" value={b.method} onChange={e => setBeneficiaries(prev => prev.map((item, i) => i === index ? { ...item, method: e.target.value } : item))}>
                        {DISBURSEMENT_METHODS.map(m => <option key={m.id} value={m.id} className="bg-[#1e1c35]">{m.label}</option>)}
                      </select>
                      <input className="input-dark" value={b.destination} onChange={e => setBeneficiaries(prev => prev.map((item, i) => i === index ? { ...item, destination: e.target.value } : item))} placeholder="Destination / account" />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="w-full py-2 rounded border border-dashed border-white/15 text-xs font-semibold text-cream/50 hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-40"
                  onClick={() => setBeneficiaries(prev => prev.length >= MAX_BENEFICIARIES ? prev : [...prev, emptyBeneficiary()])}
                  disabled={beneficiaries.length >= MAX_BENEFICIARIES}
                >
                  + Add recipient ({beneficiaries.length}/{MAX_BENEFICIARIES})
                </button>

                <div className="flex justify-end pt-2">
                  <button 
                    disabled={savingBeneficiaries} 
                    className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50" 
                    onClick={saveBeneficiaries}
                  >
                    <RiCheckboxCircleLine size={15} /> Send to Worker
                  </button>
                </div>
              </div>
            )}

            {selected.disbursements.length === 0 && !showBeneficiariesForm && selected.gig?.funding_status !== 'funding_confirmed' ? (
              <div className="p-4 rounded border border-white/8 text-xs text-cream/50">No beneficiary records yet.</div>
            ) : selected.disbursements.map(item => (
              <div key={item.id} className="p-3 rounded border border-white/8">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-sm text-cream truncate">{item.recipient_name}</p>
                  <span className={`status-${item.status}`}>{item.status.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: DIM }}>{formatCurrency(item.amount)} - {item.method.replace(/_/g, ' ')}</p>
                {item.sent_at && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: DIM }}><RiTimeLine /> Sent {formatDate(item.sent_at)}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={mobileView === 'detail' ? 'hidden lg:block' : ''}>
        <h1 className="text-3xl font-black text-cream">Operations Room</h1>
        <p className="text-cream/50 mt-1">Gig coordination threads between Operations and workers</p>
      </div>

      <div className={`${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} gap-2 overflow-x-auto pb-1`}>
        <div className="card min-w-[112px] flex-1 px-3 py-2.5"><p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Open Rooms</p><p className="mt-1 text-lg font-black text-cream leading-none">{activeRooms}</p></div>
        <div className="card min-w-[112px] flex-1 px-3 py-2.5"><p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Messages</p><p className="mt-1 text-lg font-black text-cream leading-none">{totalMessages}</p></div>
        <div className="card min-w-[112px] flex-1 px-3 py-2.5"><p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Proof Review</p><p className="mt-1 text-lg font-black text-gold leading-none">{awaitingProof}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 lg:min-h-[620px]">
        <div className={mobileView === 'detail' ? 'hidden lg:block' : 'block'}>{renderRoomList()}</div>
        <div className={mobileView === 'rooms' ? 'hidden lg:block' : 'block'}>{renderRoomDetail()}</div>
      </div>
    </div>
  );
}