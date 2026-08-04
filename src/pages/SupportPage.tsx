import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { MessageInputBar, Attachment } from '../components/ui/MessageInputBar';
import toast from 'react-hot-toast';
import { HelpCircle, MessageSquare, AlertTriangle, Phone, Mail, ExternalLink, ChevronRight, Headset } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { subscribeToTableRefresh } from '../lib/realtime';
import { useAuth } from '../hooks/useAuth';
import { SupportChatMessage, SupportChatThread } from '../types/database';

const FAQS = [
  { q: 'Do I ever use my own money?', a: 'Never. PayBridge deposits the full principal into your dedicated account before you execute any disbursements.' },
  { q: 'When is my worker fee recorded?', a: 'Your worker fee is recorded when a gig is marked complete and verified. Settlement status is tracked in your records.' },
  { q: 'What if a recipient does not receive funds?', a: 'Do not retry. Contact PayBridge support immediately via the incident report form. Do not attempt to resolve independently.' },
  { q: 'Can I use my personal bank account for disbursements?', a: 'No. You must use a dedicated account at one of our 29 partner banks, verified through Plaid.' },
  { q: 'What is the disbursement proof requirement?', a: 'After sending, immediately upload a screenshot and transaction reference in the gig dashboard.' },
  { q: 'What happens if I miss a deadline?', a: 'Your badge score is impacted. Repeated misses may result in gig reassignment or account review.' },
];

function throwIfError(error: any) {
  if (error) throw error;
}

export function SupportPage() {
  const { profile } = useAuth();
  const [showTicket, setShowTicket] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [ticket, setTicket] = useState({ subject: '', message: '' });
  const [incident, setIncident] = useState({ gig_id: '', description: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatThread, setChatThread] = useState<SupportChatThread | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  async function refreshChat() {
    if (!profile) {
      setChatThread(null);
      setChatMessages([]);
      return;
    }

    try {
      const { data: thread, error: threadError } = await supabase
        .from('support_chat_threads')
        .select('*')
        .eq('worker_id', profile.id)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      throwIfError(threadError);
      setChatThread(thread as SupportChatThread | null);

      if (!thread) {
        setChatMessages([]);
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });
      throwIfError(messagesError);
      setChatMessages((messages ?? []) as SupportChatMessage[]);
    } catch (error) {
      console.error('[paybridge] Failed to load support chat', error);
      toast.error(error instanceof Error ? error.message : 'Could not load support chat');
    }
  }

  useEffect(() => {
    void refreshChat();
    const workerId = profile?.id;
    if (!workerId) return undefined;
    return subscribeToTableRefresh(
      `worker-support-chat:${workerId}`,
      [
        { table: 'support_chat_threads', filter: `worker_id=eq.${workerId}` },
        { table: 'support_chat_messages' },
      ],
      () => { void refreshChat(); },
    );
  }, [profile?.id]);

  async function submitTicket() {
    if (!profile) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        worker_id: profile.id,
        subject: ticket.subject.trim(),
        message: ticket.message.trim(),
        type: 'general',
        priority: 'normal',
        status: 'open',
      });
      throwIfError(error);
      toast.success('Support ticket submitted. We will respond within 24 hours.');
      setTicket({ subject: '', message: '' });
      setShowTicket(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit ticket');
    } finally {
      setBusy(false);
    }
  }

  async function submitIncident() {
    if (!profile) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        worker_id: profile.id,
        subject: incident.gig_id.trim() ? `Incident: ${incident.gig_id.trim()}` : 'Incident report',
        message: incident.description.trim(),
        type: 'incident',
        priority: 'urgent',
        status: 'open',
      });
      throwIfError(error);
      toast.success('Incident reported. Do not proceed with any further disbursements until resolved.');
      setIncident({ gig_id: '', description: '' });
      setShowIncident(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit incident');
    } finally {
      setBusy(false);
    }
  }

  async function getOrCreateChatThread() {
    if (!profile) throw new Error('Worker profile required');
    if (chatThread) return chatThread;

    const { data, error } = await supabase
      .from('support_chat_threads')
      .insert({ worker_id: profile.id, status: 'open', unread_for_admin: false, unread_for_worker: false })
      .select('*')
      .single();
    throwIfError(error);
    return data as SupportChatThread;
  }

  const handleSendChatMessage = async (attachments: Attachment[]) => {
    if (!profile || (!chatInput.trim() && attachments.length === 0)) return;
    setBusy(true);

    let body = chatInput.trim();
    if (attachments.length > 0) {
      const names = attachments.map(a => a.file.name).join(', ');
      body = body ? `${body} [Attached: ${names}]` : `[Attached: ${names}]`;
    }

    try {
      const thread = await getOrCreateChatThread();
      const { error } = await supabase.from('support_chat_messages').insert({
        thread_id: thread.id,
        sender_role: 'worker',
        sender_name: profile.full_name,
        body,
      });
      throwIfError(error);

      const { error: threadError } = await supabase
        .from('support_chat_threads')
        .update({ unread_for_admin: true, unread_for_worker: false, updated_at: new Date().toISOString() })
        .eq('id', thread.id);
      throwIfError(threadError);

      setChatInput('');
      await refreshChat();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-cream">Support Center</h1>
        <p className="text-cream/50 mt-1">Get help, report issues, and review policies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Submit a Ticket', desc: 'General questions and account issues', icon: MessageSquare, action: () => setShowTicket(true), color: 'text-gold', bg: 'rgba(201,168,76,0.12)' },
          { label: 'Report an Incident', desc: 'Suspicious request or failed disbursement', icon: AlertTriangle, action: () => setShowIncident(true), color: 'text-red-400', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Live Chat', desc: 'Message the support desk', icon: Phone, action: () => setShowLiveChat(true), color: 'text-sage', bg: 'rgba(125,201,154,0.12)' },
        ].map(({ label, desc, icon: Icon, action, color, bg }) => (
          <Card key={label} padding="md" hover onClick={action}>
            <div className="w-10 h-10 rounded flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} className={color} />
            </div>
            <h3 className="font-bold text-cream text-sm mb-1">{label}</h3>
            <p className="text-xs text-cream/50">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="rounded p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-400 text-sm">If you receive a suspicious disbursement request:</p>
          <p className="text-xs text-cream/50 mt-1">
            STOP immediately. Do not send any funds. Report via the incident form above or email{' '}
            <a href="mailto:compliance.paybridge@outlook.com" className="text-red-400 underline">compliance.paybridge@outlook.com</a>.
            You are protected when you report proactively.
          </p>
        </div>
      </div>

      <Card padding="md">
        <h2 className="font-bold text-cream mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-3 rounded text-left transition-all duration-200 hover:bg-white/5">
                <p className="font-medium text-cream text-sm">{faq.q}</p>
                <ChevronRight size={16} className={`text-cream/50 transition-transform flex-shrink-0 ml-2 ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && <div className="px-3 pb-3"><p className="text-sm text-cream/50 leading-relaxed">{faq.a}</p></div>}
              {i < FAQS.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <h2 className="font-bold text-cream mb-4">Resources</h2>
        <div className="space-y-2">
          {[
            { label: 'Code of Conduct', to: '/code-of-conduct' },
            { label: 'Terms of Service', to: '/terms' },
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'FAQ', to: '/faq' },
          ].map(({ label, to }) => (
            <Link key={label} to={to} className="flex items-center justify-between p-3 rounded hover:bg-white/5 transition-colors border border-white/5 hover:border-gold/20">
              <span className="text-sm text-cream">{label}</span>
              <ExternalLink size={14} className="text-cream/50" />
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xs text-cream/50">
          <a href="mailto:assistance.paybridge@outlook.com" className="flex items-center gap-1.5 hover:text-cream break-all"><Mail size={13} className="flex-shrink-0" /> assistance.paybridge@outlook.com</a>
          <a href="mailto:compliance.paybridge@outlook.com" className="flex items-center gap-1.5 hover:text-red-400 break-all"><AlertTriangle size={13} className="flex-shrink-0" /> compliance.paybridge@outlook.com</a>
        </div>
      </Card>

      <Modal isOpen={showTicket} onClose={() => setShowTicket(false)} title="Submit Support Ticket">
        <div className="space-y-4">
          <Input label="Subject" value={ticket.subject} onChange={e => setTicket(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description" />
          <Textarea label="Message" value={ticket.message} onChange={e => setTicket(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." rows={5} />
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowTicket(false)}>Cancel</Button>
            <Button className="flex-1" onClick={submitTicket} loading={busy} disabled={!ticket.subject || !ticket.message || !profile}>Submit Ticket</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showIncident} onClose={() => setShowIncident(false)} title="Report an Incident">
        <div className="space-y-4">
          <div className="p-3 rounded text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Stop all disbursements immediately. Our compliance team will respond as quickly as possible.
          </div>
          <Input label="Gig or Client (if applicable)" value={incident.gig_id} onChange={e => setIncident(p => ({ ...p, gig_id: e.target.value }))} placeholder="Client name or gig reference" />
          <Textarea label="Describe the incident" value={incident.description} onChange={e => setIncident(p => ({ ...p, description: e.target.value }))} placeholder="What happened? Include any suspicious instructions received." rows={5} />
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowIncident(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={submitIncident} loading={busy} disabled={!incident.description || !profile}>Submit Incident Report</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} title="Live Support Chat">
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {chatMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-2 flex-row">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-white/10"><Headset size={12} className="text-cream" /></div>
                  <div className="p-3 rounded-lg text-sm bg-white/10 text-cream rounded-tl-none">Hello. How can we help today?</div>
                </div>
              </div>
            )}
            {chatMessages.map(msg => {
              const isWorker = msg.sender_role === 'worker';
              return (
                <div key={msg.id} className={`flex ${isWorker ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] gap-2 ${isWorker ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: isWorker ? '#C9A84C' : 'rgba(255,255,255,0.1)' }}>
                      {isWorker ? <MessageSquare size={12} className="text-[#0B132F]" /> : <Headset size={12} className="text-cream" />}
                    </div>
                    <div className={`p-3 rounded-lg text-sm ${isWorker ? 'bg-gold text-[#0B132F] rounded-tr-none' : 'bg-white/10 text-cream rounded-tl-none'}`}>{msg.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t border-white/10 mt-auto">
            <MessageInputBar value={chatInput} onChange={setChatInput} onSend={handleSendChatMessage} placeholder="Type your message..." disabled={!profile || busy} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SupportPage;