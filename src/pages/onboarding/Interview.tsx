import { useState, useEffect, useRef, useCallback } from 'react';
import { RiMessage2Line, RiCalendarEventLine, RiCheckboxCircleLine, RiSendPlaneLine, RiTimeLine, RiRefreshLine, RiCalendarCloseLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import {
  scheduleWorkerInterview,
  getWorkerInterviewSlot,
  getInterviewMessages,
  sendInterviewMessage,
} from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { InterviewSlot, InterviewMessage } from '../../types/database';

const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';
const GOLD  = '#C9A84C';
const SAGE  = '#7DC99A';
const NAVY8 = '#12203F';
const BORDER = 'rgba(241,240,218,0.09)';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

/** Generate the next N business days from today */
function getBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // start tomorrow
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function timeToIso(day: Date, timeLabel: string): string {
  const [timePart, ampm] = timeLabel.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ── sub-components ────────────────────────────────────────────────

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

// ── main component ────────────────────────────────────────────────

export function OnboardingInterview() {
  const { profile } = useAppStore();
  const navigate     = useNavigate();
  const chatEndRef   = useRef<HTMLDivElement>(null);
  const stepIdx      = ONBOARDING_STEPS.findIndex(s => s.id === 'interview') + 1;

  const businessDays = getBusinessDays(7);

  // Calendar state
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking]           = useState(false);

  // Slot & messages state
  const [slot, setSlot]         = useState<InterviewSlot | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [fetching, setFetching] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending]     = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const loadSlot = useCallback(async () => {
    if (!profile) return;
    try {
      const s = await getWorkerInterviewSlot(profile.id);
      setSlot(s ?? null);
      if (s) {
        const msgs = await getInterviewMessages(s.id);
        setMessages(msgs);
      }
    } finally {
      setFetching(false);
    }
  }, [profile]);

  useEffect(() => { void loadSlot(); }, [loadSlot]);

  // Auto-poll every 6s when a slot is scheduled/live
  useEffect(() => {
    if (!slot || slot.status === 'completed') return;
    const id = setInterval(async () => {
      if (!slot) return;
      const msgs = await getInterviewMessages(slot.id);
      setMessages(msgs);
      // Refresh slot status too
      const s = await getWorkerInterviewSlot(profile!.id);
      setSlot(s ?? null);
      if (s?.passed === true) navigate('/onboarding/training');
    }, 6000);
    return () => clearInterval(id);
  }, [slot, profile, navigate]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleBook() {
    if (!selectedDay || !selectedTime || !profile) return;
    setBooking(true);
    try {
      const iso = timeToIso(selectedDay, selectedTime);
      await scheduleWorkerInterview(profile.id, iso);
      await loadSlot();
      setRescheduling(false);
    } finally {
      setBooking(false);
    }
  }

  async function handleSend() {
    if (!chatInput.trim() || !slot || sending) return;
    setSending(true);
    const body = chatInput.trim();
    setChatInput('');
    try {
      await sendInterviewMessage(slot.id, 'worker', profile?.full_name || 'Applicant', body);
      const msgs = await getInterviewMessages(slot.id);
      setMessages(msgs);
    } finally {
      setSending(false);
    }
  }

  // ── loading ──
  if (fetching) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ── passed — redirect handled by poll; show waiting screen ──
  if (slot?.passed === true) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(125,201,154,0.15)', border: '1px solid rgba(125,201,154,0.3)' }}>
              <RiCheckboxCircleLine style={{ color: SAGE, fontSize: 32 }} />
            </div>
            <h2 className="text-2xl font-black text-cream mb-2">Interview Passed!</h2>
            <p className="text-cream/50 mb-6">Congratulations — you've been cleared to proceed to training.</p>
            <Button className="w-full" size="lg" onClick={() => navigate('/onboarding/training')}>
              Continue to Training →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── failed ──
  if (slot?.passed === false) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(200,82,61,0.12)', border: '1px solid rgba(200,82,61,0.3)' }}>
              <RiCalendarCloseLine style={{ color: '#C8523D', fontSize: 32 }} />
            </div>
            <h2 className="text-2xl font-black text-cream mb-2">Interview Not Passed</h2>
            <p className="text-sm text-cream/50 mb-4 leading-relaxed">
              {slot.rejection_reason || 'Unfortunately you did not meet the requirements at this time.'}
            </p>
            <p className="text-xs text-cream/35">Contact support if you believe this decision needs review.</p>
          </div>
        </Card>
      </div>
    );
  }

  // ── schedule or reschedule view ──
  const showScheduler = !slot || rescheduling;

  if (showScheduler) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
            Step {stepIdx} of {ONBOARDING_STEPS.length} — Live Interview
          </p>
          <h1 className="text-3xl font-black text-cream">Schedule Your Interview</h1>
          <p className="text-cream/50 mt-1 text-sm">
            A 10–15 minute live chat with our onboarding team. You must pass this screening to access training.
          </p>
        </div>

        <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

        <Card padding="md">
          <h3 className="font-bold text-cream mb-3 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>What to expect:</h3>
          <ul className="space-y-2 text-sm" style={{ color: DIM }}>
            {[
              'Identity confirmation & background check',
              'Review of the pre-funded disbursement model',
              'Confirmation you have a dedicated bank account',
              'Compliance & AML awareness check',
              'Your questions answered by our team',
            ].map(t => (
              <li key={t} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: GOLD }} />
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: DIM }}>
            <RiMessage2Line size={15} /> Format — Live Chat Only
          </p>
          <div
            className="flex items-center gap-3 p-3 rounded border text-sm font-semibold"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', color: GOLD }}
          >
            <RiMessage2Line size={16} /> Live Chat (text-based, real-time)
          </div>
          <p className="text-xs mt-2" style={{ color: DIM }}>You will chat with a PayBridge agent directly in this portal at your chosen time.</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: DIM }}>
            <RiCalendarEventLine size={15} /> Select a date &amp; time (EST):
          </p>
          <div className="space-y-5">
            {businessDays.map(day => (
              <div key={day.toISOString()}>
                <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: selectedDay?.toDateString() === day.toDateString() ? GOLD : DIM }}>
                  {formatDayLabel(day)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(t => {
                    const active = selectedDay?.toDateString() === day.toDateString() && selectedTime === t;
                    return (
                      <button
                        key={t}
                        onClick={() => { setSelectedDay(day); setSelectedTime(t); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center gap-1"
                        style={{
                          background:   active ? 'rgba(201,168,76,0.15)' : 'transparent',
                          border:       `1px solid ${active ? GOLD : BORDER}`,
                          color:        active ? GOLD : DIM,
                        }}
                      >
                        <span style={{ color: GOLD, fontSize: 13 }}>+</span> {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {selectedDay && selectedTime && (
          <div className="p-3 rounded text-sm" style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.2)` }}>
            <span style={{ color: DIM }}>Selected: </span>
            <span style={{ color: CREAM, fontWeight: 600 }}>{formatDayLabel(selectedDay)} at {selectedTime} EST</span>
          </div>
        )}

        <div className="flex gap-3">
          {rescheduling && (
            <Button variant="secondary" onClick={() => setRescheduling(false)}>Cancel</Button>
          )}
          <Button
            className="flex-1"
            size="lg"
            onClick={handleBook}
            disabled={!selectedDay || !selectedTime}
            loading={booking}
            icon={<RiCalendarEventLine size={15} />}
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    );
  }

  // ── pending / live chat view ──
  const isLive      = slot.status === 'live';
  const scheduledAt = new Date(slot.scheduled_at);
  const isPast      = Date.now() > scheduledAt.getTime();

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} — Live Interview
        </p>
        <h1 className="text-3xl font-black text-cream">Interview Room</h1>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

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
        <button
          className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
          style={{ color: DIM }}
          onClick={() => setRescheduling(true)}
        >
          <RiCalendarEventLine size={13} /> Reschedule
        </button>
      </div>

      {/* Chat area */}
      <div
        className="rounded flex flex-col"
        style={{ border: `1px solid ${BORDER}`, background: NAVY8, minHeight: 380 }}
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 380 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
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
