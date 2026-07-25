import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RiAlertLine, RiCheckboxCircleLine, RiInboxLine, RiMessage2Line, RiSendPlaneLine } from 'react-icons/ri';
import { localDb } from '../../lib/localDb';
import { formatDate, formatRelativeTime } from '../../lib/utils';
import { MessageInputBar, Attachment } from '../../components/ui/MessageInputBar';

type Ticket = ReturnType<typeof localDb.listSupportTickets>[number];
type ChatThread = ReturnType<typeof localDb.listSupportChatThreads>[number];

const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.50)';
const GOLD = '#C9A84C';
const BORDER = 'rgba(241,240,218,0.09)';

export function AdminInbox() {
  const [tickets, setTickets] = useState<Ticket[]>(() => localDb.listSupportTickets('all'));
  const [threads, setThreads] = useState<ChatThread[]>(() => localDb.listSupportChatThreads());
  const [activeTab, setActiveTab] = useState<'tickets' | 'chat'>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  function refresh() {
    const nextTickets = localDb.listSupportTickets('all');
    const nextThreads = localDb.listSupportChatThreads();
    setTickets(nextTickets);
    setThreads(nextThreads);
    setSelectedTicketId(current => current ?? nextTickets[0]?.id ?? null);
    setSelectedThreadId(current => current ?? nextThreads[0]?.id ?? null);
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const openTickets = tickets.filter(ticket => ticket.status !== 'resolved').length;
  const unreadChats = threads.filter(thread => thread.unread_for_admin).length;
  const visibleTickets = tickets.filter(ticket => showResolved || ticket.status !== 'resolved');
  
  const selectedTicket = useMemo(() => tickets.find(ticket => ticket.id === selectedTicketId) ?? visibleTickets[0] ?? null, [tickets, selectedTicketId, visibleTickets]);
  const selectedThread = useMemo(() => threads.find(thread => thread.id === selectedThreadId) ?? threads[0] ?? null, [threads, selectedThreadId]);

  function updateTicket(status: Ticket['status']) {
    if (!selectedTicket) return;
    localDb.updateSupportTicketStatus(selectedTicket.id, status);
    refresh();
    toast.success(status === 'resolved' ? 'Ticket resolved' : 'Ticket updated');
  }

  function openThread(threadId: string) {
    setSelectedThreadId(threadId);
    localDb.markSupportChatReadForAdmin(threadId);
    refresh();
  }

  function sendReply(attachments: Attachment[]) {
    if (!selectedThread || (!reply.trim() && attachments.length === 0)) return;
    let body = reply.trim();
    if (attachments.length > 0) {
      const names = attachments.map(a => a.file.name).join(', ');
      body = body ? `${body} [Attached: ${names}]` : `[Attached: ${names}]`;
    }
    localDb.sendSupportChatMessage(selectedThread.worker_id, 'support', 'PayBridge Support', body);
    setReply('');
    refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-cream">Inbox</h1>
        <p className="text-cream/50 mt-1">Support tickets and live chat from workers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5"><p className="text-xs text-cream/50">Open Tickets</p><p className="text-2xl font-black text-cream">{openTickets}</p></div>
        <div className="card p-5"><p className="text-xs text-cream/50">Unread Chats</p><p className="text-2xl font-black text-gold">{unreadChats}</p></div>
        <div className="card p-5"><p className="text-xs text-cream/50">Total Conversations</p><p className="text-2xl font-black text-cream">{tickets.length + threads.length}</p></div>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'tickets' as const, label: 'Tickets', count: openTickets, Icon: RiInboxLine },
          { id: 'chat' as const, label: 'Live Chat', count: threads.length, Icon: RiMessage2Line },
        ].map(({ id, label, count, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-2 rounded text-xs font-semibold border transition-all flex items-center gap-2 ${activeTab === id ? 'bg-gold/15 border-primary-500/40 text-gold/80' : 'border-white/8 text-cream/50 hover:text-cream'}`}>
            <Icon size={15} /> {label} ({count})
          </button>
        ))}
      </div>

      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[520px]">
          <div className="card overflow-hidden flex flex-col">
            <div className="p-3 border-b flex justify-between items-center bg-white/5" style={{ borderColor: BORDER }}>
              <span className="text-xs font-semibold text-cream">Tickets</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-cream/50 hover:text-cream transition-colors">
                <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="rounded bg-black/20 border-white/10" />
                Show resolved
              </label>
            </div>
            <div className="overflow-y-auto flex-1">
              {visibleTickets.length === 0 ? (
                <div className="p-8 text-center text-cream/50">No tickets found</div>
              ) : visibleTickets.map(ticket => (
              <button key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="w-full text-left p-4 border-b hover:bg-white/5 transition-colors" style={{ borderColor: BORDER, background: selectedTicket?.id === ticket.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-sm truncate" style={{ color: CREAM }}>{ticket.subject}</p>
                  <span className={`status-${ticket.status}`}>{ticket.status.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: DIM }}>{ticket.worker?.full_name ?? 'Worker'} - {formatRelativeTime(ticket.updated_at)}</p>
                <p className="text-xs mt-2 line-clamp-2" style={{ color: DIM }}>{ticket.message}</p>
                  {ticket.priority === 'urgent' && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><RiAlertLine /> Urgent incident</p>}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            {!selectedTicket ? (
              <div className="h-full flex items-center justify-center text-cream/50">Select a ticket</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label mb-1">{selectedTicket.type === 'incident' ? 'Incident' : 'Support Ticket'}</p>
                    <h2 className="text-xl font-black text-cream">{selectedTicket.subject}</h2>
                    <p className="text-xs text-cream/50 mt-1">{selectedTicket.worker?.full_name ?? 'Worker'} - {formatDate(selectedTicket.created_at)}</p>
                  </div>
                  <span className={`status-${selectedTicket.status}`}>{selectedTicket.status.replace(/_/g, ' ')}</span>
                </div>
                {selectedTicket.gig && <div className="p-3 rounded border border-white/8 text-sm text-cream/70">Related gig: <span className="font-semibold text-cream">{selectedTicket.gig.client_name}</span></div>}
                <div className="p-4 rounded" style={{ background: 'rgba(241,240,218,0.04)', border: `1px solid ${BORDER}` }}>
                  <p className="text-sm leading-relaxed text-cream/80 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary" onClick={() => updateTicket('in_progress')}>Mark In Progress</button>
                  <button className="btn-primary" onClick={() => updateTicket('resolved')}><RiCheckboxCircleLine size={15} /> Resolve</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[520px]">
          <div className="card overflow-hidden">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-cream/50">No live chat conversations yet</div>
            ) : threads.map(thread => {
              const last = thread.messages[thread.messages.length - 1];
              return (
                <button key={thread.id} onClick={() => openThread(thread.id)} className="w-full text-left p-4 border-b hover:bg-white/5 transition-colors" style={{ borderColor: BORDER, background: selectedThread?.id === thread.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-sm truncate" style={{ color: CREAM }}>{thread.worker?.full_name ?? 'Worker'}</p>
                    {thread.unread_for_admin && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                  </div>
                  <p className="text-xs mt-1" style={{ color: DIM }}>{formatRelativeTime(thread.updated_at)}</p>
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: DIM }}>{last?.body ?? 'No messages yet'}</p>
                </button>
              );
            })}
          </div>

          <div className="card p-5 flex flex-col">
            {!selectedThread ? (
              <div className="h-full flex items-center justify-center text-cream/50">Select a chat</div>
            ) : (
              <>
                <div className="border-b pb-4 mb-4" style={{ borderColor: BORDER }}>
                  <h2 className="text-xl font-black text-cream">{selectedThread.worker?.full_name ?? 'Worker'}</h2>
                  <p className="text-xs text-cream/50">Live support conversation</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  {selectedThread.messages.map(message => {
                    const isSupport = message.sender_role === 'support';
                    return (
                      <div key={message.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded p-3 text-sm ${isSupport ? 'bg-gold text-[#0B132F]' : 'bg-white/10 text-cream'}`}>
                          <p className="text-[11px] font-semibold opacity-70 mb-1">{message.sender_name}</p>
                          <p className="whitespace-pre-wrap">{message.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 mt-4 border-t" style={{ borderColor: BORDER }}>
                  <MessageInputBar
                    value={reply}
                    onChange={setReply}
                    onSend={sendReply}
                    placeholder="Reply to worker..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

