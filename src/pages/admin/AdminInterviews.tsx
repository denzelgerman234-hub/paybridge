import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getInterviewMessages,
  sendInterviewMessage,
  passInterview,
  failInterview,
} from '../../lib/onboardingData';
import type { InterviewSlot, InterviewMessage, WorkerProfile } from '../../types/database';
import { RiMessage2Line, RiTimeLine, RiCheckboxCircleLine, RiCloseCircleLine, RiSendPlaneLine, RiRefreshLine, RiUserLine, RiCalendarEventLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

const CREAM  = '#F1F0DA';
const DIM    = 'rgba(241,240,218,0.45)';
const GOLD   = '#C9A84C';
const SAGE   = '#7DC99A';
const TERRA  = '#C8523D';
const BORDER = 'rgba(241,240,218,0.08)';
const NAVY8  = '#12203F';
const BG     = '#0D1632';

type EnrichedSlot = InterviewSlot & { worker: WorkerProfile | null };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChatBubble({ msg }: { msg: InterviewMessage }) {
  const isAdmin = msg.sender_role === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded px-3 py-2 text-sm"
        style={{ background: isAdmin ? GOLD : 'rgba(255,255,255,0.07)', color: isAdmin ? '#0B132F' : CREAM }}
      >
        <p className="text-[11px] font-semibold opacity-60 mb-0.5">{msg.sender_name} · {formatTime(msg.created_at)}</p>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
      </div>
    </div>
  );
}

function StatusBadge({ slot }: { slot: EnrichedSlot }) {
  if (slot.passed === true)  return <span className="status-verified text-[10px]">Passed</span>;
  if (slot.passed === false) return <span className="status-failed text-[10px]">Failed</span>;
  if (slot.status === 'live') return (
    <span className="status-base text-[10px] flex items-center gap-1" style={{ background: 'rgba(125,201,154,0.1)', color: SAGE, border: '1px solid rgba(125,201,154,0.25)' }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SAGE }} /> Live
    </span>
  );
  if (slot.status === 'cancelled') return <span className="status-base text-[10px]" style={{ color: DIM }}>Cancelled</span>;
  return <span className="status-pending text-[10px]">Scheduled</span>;
}

export function AdminInterviews() {
  const [slots, setSlots]         = useState<EnrichedSlot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<EnrichedSlot | null>(null);
  const [messages, setMessages]   = useState<InterviewMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [failReason, setFailReason]   = useState('');
  const [showFailForm, setShowFailForm] = useState(false);
  const [mobileView, setMobileView]   = useState<'list' | 'detail'>('list');
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function loadSlots() {
    setLoading(true);
    try {
      const { data: slotData, error: slotErr } = await supabase
        .from('interview_slots')
        .select('*')
        .order('scheduled_at', { ascending: false });
      if (slotErr) throw slotErr;

      const { data: profileData } = await supabase.from('worker_profiles').select('*');
      const profileById = new Map<string, WorkerProfile>(
        ((profileData ?? []) as WorkerProfile[]).map(p => [p.id, p])
      );

      const enriched: EnrichedSlot[] = ((slotData ?? []) as InterviewSlot[]).map(s => ({
        ...s,
        worker: profileById.get(s.worker_id) ?? null,
      }));
      setSlots(enriched);
    } catch (err) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }

  const loadMessages = useCallback(async (slotId: string) => {
    const msgs = await getInterviewMessages(slotId);
    setMessages(msgs);
  }, []);

  useEffect(() => { void loadSlots(); }, []);

  // Auto-poll messages for selected slot
  useEffect(() => {
    if (!selected || selected.status === 'completed') return;
    const id = setInterval(() => void loadMessages(selected.id), 5000);
    return () => clearInterval(id);
  }, [selected, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function selectSlot(slot: EnrichedSlot) {
    setSelected(slot);
    setShowFailForm(false);
    setFailReason('');
    setChatInput('');
    setMobileView('detail');
    const msgs = await getInterviewMessages(slot.id);
    setMessages(msgs);
  }

  async function handleSend() {
    if (!chatInput.trim() || !selected || sending) return;
    setSending(true);
    const body = chatInput.trim();
    setChatInput('');
    try {
      await sendInterviewMessage(selected.id, 'admin', 'PayBridge Operations', body);
      // Mark slot as live when admin first messages
      if (selected.status === 'scheduled') {
        await supabase.from('interview_slots').update({ status: 'live' }).eq('id', selected.id);
        setSelected(prev => prev ? { ...prev, status: 'live' } : null);
        setSlots(prev => prev.map(s => s.id === selected.id ? { ...s, status: 'live' } : s));
      }
      await loadMessages(selected.id);
    } finally {
      setSending(false);
    }
  }

  async function handlePass() {
    if (!selected?.worker || busy) return;
    setBusy(true);
    try {
      await passInterview(selected.worker.id, selected.id);
      toast.success(`${selected.worker.full_name} passed — advanced to Training`);
      // Send notification
      await supabase.from('notifications').insert({
        worker_id: selected.worker.id,
        title: 'Interview passed 🎉',
        body: 'Congratulations! You have passed your interview and can now proceed to training.',
        href: '/onboarding/training',
      });
      await loadSlots();
      setSelected(prev => prev ? { ...prev, status: 'completed', passed: true } : null);
    } finally {
      setBusy(false);
    }
  }

  async function handleFail() {
    if (!selected?.worker || !failReason.trim() || busy) return;
    setBusy(true);
    try {
      await failInterview(selected.worker.id, selected.id, failReason.trim());
      toast.success('Interview marked as failed — worker notified');
      await loadSlots();
      setSelected(prev => prev ? { ...prev, status: 'completed', passed: false } : null);
      setShowFailForm(false);
    } finally {
      setBusy(false);
    }
  }

  // ── Counts ──
  const pending   = slots.filter(s => s.status === 'scheduled').length;
  const live      = slots.filter(s => s.status === 'live').length;
  const completed = slots.filter(s => s.status === 'completed').length;

  // ── Render list ──
  function renderList() {
    return (
      <div className="card overflow-hidden flex flex-col h-full" style={{ minHeight: 520 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
            All Interviews
          </p>
          <button onClick={() => void loadSlots()} className="text-cream/40 hover:text-cream transition-colors">
            <RiRefreshLine size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-12">
              <RiCalendarEventLine size={28} style={{ color: 'rgba(201,168,76,0.25)', margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: DIM }}>No interviews scheduled yet</p>
            </div>
          ) : (
            slots.map(slot => (
              <button
                key={slot.id}
                onClick={() => void selectSlot(slot)}
                className="w-full text-left px-4 py-3 transition-colors"
                style={{
                  background: selected?.id === slot.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                  borderLeft: selected?.id === slot.id ? `2px solid ${GOLD}` : '2px solid transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold truncate" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {slot.worker?.full_name ?? 'Unknown Worker'}
                  </p>
                  <StatusBadge slot={slot} />
                </div>
                <p className="text-[11px] truncate" style={{ color: DIM }}>
                  <RiTimeLine className="inline mr-1" size={11} />
                  {formatDateTime(slot.scheduled_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Render detail ──
  function renderDetail() {
    if (!selected) {
      return (
        <div className="card flex items-center justify-center" style={{ minHeight: 520 }}>
          <div className="text-center">
            <RiMessage2Line size={32} style={{ color: 'rgba(201,168,76,0.2)', margin: '0 auto 10px' }} />
            <p className="text-sm font-semibold" style={{ color: CREAM }}>Select an interview</p>
            <p className="text-xs mt-1" style={{ color: DIM }}>Choose from the list to open the chat room</p>
          </div>
        </div>
      );
    }

    const isDone   = selected.status === 'completed';
    const isLive   = selected.status === 'live';
    const isPast   = Date.now() > new Date(selected.scheduled_at).getTime();
    const canChat  = !isDone;

    return (
      <div className="card flex flex-col" style={{ minHeight: 520 }}>
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: BORDER }}>
          <button
            className="lg:hidden text-cream/50 hover:text-cream transition-colors mr-1"
            onClick={() => setMobileView('list')}
          >
            ←
          </button>
          <div
            className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {selected.worker?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: CREAM, fontFamily: "'Space Grotesk', sans-serif" }}>
              {selected.worker?.full_name ?? 'Unknown Worker'}
            </p>
            <p className="text-[11px] truncate flex items-center gap-1" style={{ color: DIM }}>
              <RiTimeLine size={11} /> {formatDateTime(selected.scheduled_at)}
            </p>
          </div>
          <StatusBadge slot={selected} />
        </div>

        {/* Result banner */}
        {isDone && (
          <div
            className="flex-shrink-0 px-4 py-3 border-b text-sm font-semibold flex items-center gap-2"
            style={{
              borderColor: BORDER,
              background: selected.passed ? 'rgba(125,201,154,0.07)' : 'rgba(200,82,61,0.07)',
              color: selected.passed ? SAGE : TERRA,
            }}
          >
            {selected.passed
              ? <><RiCheckboxCircleLine size={15} /> Interview passed — worker advanced to Training</>
              : <><RiCloseCircleLine size={15} /> Interview failed — {selected.rejection_reason}</>}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 360 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <RiMessage2Line size={24} style={{ color: 'rgba(201,168,76,0.2)', marginBottom: 8 }} />
              <p className="text-sm" style={{ color: DIM }}>No messages yet — send the first message to begin</p>
            </div>
          ) : (
            messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        {canChat && (
          <div className="flex-shrink-0 px-4 py-3 border-t space-y-3" style={{ borderColor: BORDER, background: `${BG}80` }}>
            {!isDone && !isLive && isPast && (
              <p className="text-xs px-2 py-1.5 rounded" style={{ background: 'rgba(201,168,76,0.06)', color: GOLD, border: '1px solid rgba(201,168,76,0.2)' }}>
                ⏱ Scheduled time has passed. Send a message to open the live session.
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                className="flex-1 input-dark text-sm"
                placeholder="Message the applicant…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                disabled={sending}
              />
              <button
                disabled={!chatInput.trim() || sending}
                onClick={() => void handleSend()}
                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded transition-all disabled:opacity-30"
                style={{ background: GOLD, color: '#0B132F' }}
              >
                <RiSendPlaneLine size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Pass / Fail actions */}
        {!isDone && (
          <div className="flex-shrink-0 px-4 py-3 border-t space-y-3" style={{ borderColor: BORDER }}>
            {showFailForm ? (
              <div className="space-y-2">
                <textarea
                  className="input-dark w-full resize-none text-xs"
                  rows={2}
                  placeholder="Reason for failing (required, visible to applicant)…"
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    disabled={busy || !failReason.trim()}
                    onClick={() => void handleFail()}
                    className="flex-1 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-40"
                    style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}
                  >
                    {busy ? 'Processing…' : 'Confirm Fail'}
                  </button>
                  <button
                    className="px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    style={{ color: DIM }}
                    onClick={() => { setShowFailForm(false); setFailReason(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => void handlePass()}
                  className="flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(125,201,154,0.12)', color: SAGE, border: '1px solid rgba(125,201,154,0.25)' }}
                >
                  <RiCheckboxCircleLine size={14} /> Pass Interview
                </button>
                <button
                  disabled={busy}
                  onClick={() => setShowFailForm(true)}
                  className="flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}
                >
                  <RiCloseCircleLine size={14} /> Fail Interview
                </button>
              </div>
            )}
            <p className="text-[11px] text-center" style={{ color: DIM }}>
              Passing advances the applicant to training. Failing notifies them with your reason.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={mobileView === 'detail' ? 'hidden lg:block' : ''}>
        <h1 className="text-3xl font-black text-cream">Interviews</h1>
        <p className="text-cream/50 mt-1">Screen applicants before granting training access</p>
      </div>

      {/* Stats */}
      <div className={`${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} gap-2 overflow-x-auto pb-1`}>
        <div className="card min-w-[100px] flex-1 px-3 py-2.5">
          <p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Scheduled</p>
          <p className="mt-1 text-lg font-black text-gold leading-none">{pending}</p>
        </div>
        <div className="card min-w-[100px] flex-1 px-3 py-2.5">
          <p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Live Now</p>
          <p className="mt-1 text-lg font-black leading-none" style={{ color: SAGE }}>{live}</p>
        </div>
        <div className="card min-w-[100px] flex-1 px-3 py-2.5">
          <p className="text-[10px] text-cream/50 uppercase tracking-wide leading-none">Completed</p>
          <p className="mt-1 text-lg font-black text-cream leading-none">{completed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className={mobileView === 'detail' ? 'hidden lg:block' : 'block'}>{renderList()}</div>
        <div className={mobileView === 'list' ? 'hidden lg:block' : 'block'}>{renderDetail()}</div>
      </div>
    </div>
  );
}
