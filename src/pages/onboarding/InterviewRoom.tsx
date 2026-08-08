import { useState, useEffect, useRef, useCallback } from 'react';
import { RiMessage2Line, RiTimeLine, RiCheckboxCircleLine, RiSendPlaneLine, RiRefreshLine, RiCalendarCloseLine } from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getWorkerInterviewSlotByToken,
  getInterviewMessages,
  sendInterviewMessage,
} from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { Card } from '../../components/ui/Card';
import type { InterviewSlot, InterviewMessage } from '../../types/database';

const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';
const GOLD  = '#C9A84C';
const SAGE  = '#7DC99A';
const NAVY8 = '#12203F';
const BORDER = 'rgba(241,240,218,0.09)';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function ChatBubble({ msg }: { msg: InterviewMessage }) {
  const isWorker = msg.sender_role === 'worker';
  return (
    <div className={`flex ${isWorker ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded px-3 py-2 text-sm"
        style={{ background: isWorker ? GOLD : 'rgba(255,255,255,0.07)', color: isWorker ? '#0B132F' : CREAM }}
      >
        <p className="text-[11px] font-semibold opacity-60 mb-0.5">{msg.sender_name} · {formatTime(msg.created_at)}</p>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
      </div>
    </div>
  );
}

export function InterviewRoom() {
  const { token } = useParams<{ token: string }>();
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [slot, setSlot] = useState<InterviewSlot | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const loadSlot = useCallback(async () => {
    if (!token) {
      setInvalidToken(true);
      setFetching(false);
      return;
    }
    try {
      const s = await getWorkerInterviewSlotByToken(token);
      if (!s) {
        setInvalidToken(true);
      } else {
        setSlot(s);
        const msgs = await getInterviewMessages(s.id);
        setMessages(msgs);
      }
    } catch {
      setInvalidToken(true);
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => { void loadSlot(); }, [loadSlot]);

  // Auto-poll every 6s when a slot is scheduled/live
  useEffect(() => {
    if (!slot || slot.status === 'completed' || slot.status === 'cancelled') return;
    const id = setInterval(async () => {
      if (!slot) return;
      const msgs = await getInterviewMessages(slot.id);
      setMessages(msgs);
      
      if (token) {
        const s = await getWorkerInterviewSlotByToken(token);
        setSlot(s ?? null);
      }
    }, 6000);
    return () => clearInterval(id);
  }, [slot, token]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!chatInput.trim() || !slot || sending || !profile) return;
    setSending(true);
    const body = chatInput.trim();
    setChatInput('');
    try {
      await sendInterviewMessage(slot.id, 'worker', profile.full_name || 'Applicant', body);
      const msgs = await getInterviewMessages(slot.id);
      setMessages(msgs);
    } finally {
      setSending(false);
    }
  }

  if (fetching) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (invalidToken || !slot || slot.status === 'completed' || slot.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto py-12 animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(200,82,61,0.12)', border: '1px solid rgba(200,82,61,0.3)' }}>
              <RiCalendarCloseLine style={{ color: '#C8523D', fontSize: 32 }} />
            </div>
            <h2 className="text-2xl font-black text-cream mb-2">Link Expired or Invalid</h2>
            <p className="text-sm text-cream/50 mb-4 leading-relaxed">
              This interview link is no longer active. The interview has either been completed, cancelled, or the link is incorrect.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gold text-sm font-semibold hover:underline"
            >
              Return to Dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const isLive = slot.status === 'live';
  const scheduledAt = new Date(slot.scheduled_at);
  const isPast = Date.now() > scheduledAt.getTime();

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in py-8 px-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          PayBridge Operations
        </p>
        <h1 className="text-3xl font-black text-cream">Live Interview Room</h1>
      </div>

      {/* Status banner */}
      <div
        className="p-4 rounded flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: isLive ? 'rgba(125,201,154,0.08)' : 'rgba(201,168,76,0.06)',
          border: `1px solid ${isLive ? 'rgba(125,201,154,0.25)' : 'rgba(201,168,76,0.2)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          {isLive ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: SAGE }} />
              <div>
                <p className="text-sm font-bold" style={{ color: SAGE }}>Live — Agent is ready</p>
                <p className="text-xs" style={{ color: DIM }}>Send your first message to begin the interview.</p>
              </div>
            </>
          ) : (
            <>
              <RiTimeLine size={18} style={{ color: GOLD, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: CREAM }}>
                  {isPast ? 'Waiting for agent to join…' : `Scheduled for ${formatDateTime(slot.scheduled_at)}`}
                </p>
                <p className="text-xs" style={{ color: DIM }}>
                  {isPast
                    ? 'An agent will join shortly. You may send a message now.'
                    : 'A PayBridge agent will join at your appointment time.'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className="rounded flex flex-col"
        style={{ border: `1px solid ${BORDER}`, background: NAVY8, minHeight: 480 }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
          <RiMessage2Line size={14} style={{ color: GOLD }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
            Interview Chat
          </p>
          {isLive && (
            <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: SAGE }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SAGE }} /> Live
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 480 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <RiMessage2Line size={28} style={{ color: 'rgba(201,168,76,0.25)', marginBottom: 10 }} />
              <p className="text-sm font-semibold" style={{ color: CREAM }}>No messages yet</p>
              <p className="text-xs mt-1" style={{ color: DIM }}>
                {isLive
                  ? 'The agent is ready. Say hello to get started.'
                  : 'Messages will appear here once your session begins.'}
              </p>
            </div>
          ) : (
            messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 input-dark text-sm"
              placeholder={isLive || isPast ? 'Type your message…' : 'Chat opens at your scheduled time'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={(!isLive && !isPast) || sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            />
            <button
              disabled={(!isLive && !isPast) || !chatInput.trim() || sending}
              onClick={() => void handleSend()}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded transition-all disabled:opacity-30"
              style={{ background: GOLD, color: '#0B132F' }}
            >
              <RiSendPlaneLine size={15} />
            </button>
          </div>
          <button
            className="flex items-center gap-1.5 text-[11px] mt-2 transition-colors"
            style={{ color: DIM }}
            onClick={() => void loadSlot()}
          >
            <RiRefreshLine size={11} /> Refresh messages
          </button>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: DIM }}>
        This chat is monitored by PayBridge Operations. All messages are recorded.
      </p>
    </div>
  );
}
