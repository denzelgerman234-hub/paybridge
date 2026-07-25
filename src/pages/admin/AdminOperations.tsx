import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RiBriefcaseLine, RiCheckboxCircleLine, RiMessage2Line, RiSendPlaneLine, RiTimeLine } from 'react-icons/ri';
import { localDb } from '../../lib/localDb';
import { formatCurrency, formatDate, formatRelativeTime } from '../../lib/utils';
import { MessageInputBar, Attachment } from '../../components/ui/MessageInputBar';

type OperationRoom = ReturnType<typeof localDb.listOperationRooms>[number];

const BORDER = 'rgba(241,240,218,0.09)';
const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.50)';
const GOLD = '#C9A84C';

export function AdminOperations() {
  const [rooms, setRooms] = useState<OperationRoom[]>(() => localDb.listOperationRooms());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  function refresh() {
    const next = localDb.listOperationRooms();
    setRooms(next);
    setSelectedId(current => current ?? next[0]?.id ?? null);
  }

  useEffect(() => {
    refresh();
    return localDb.subscribe(refresh);
  }, []);

  const selected = useMemo(() => rooms.find(room => room.id === selectedId) ?? rooms[0] ?? null, [rooms, selectedId]);
  const activeRooms = rooms.filter(room => room.status === 'open').length;
  const awaitingProof = rooms.reduce((count, room) => count + room.disbursements.filter(d => d.status === 'sent').length, 0);

  function sendMessage(attachments: Attachment[]) {
    if (!selected || (!message.trim() && attachments.length === 0)) return;
    let body = message.trim();
    if (attachments.length > 0) {
      const names = attachments.map(a => a.file.name).join(', ');
      body = body ? `${body} [Attached: ${names}]` : `[Attached: ${names}]`;
    }
    localDb.sendMessage(selected.id, 'operations', selected.specialist_name || 'Operations', body);
    setMessage('');
    refresh();
    toast.success('Message sent');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-cream">Operations Room</h1>
        <p className="text-cream/50 mt-1">Gig coordination threads between Operations and workers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5"><p className="text-xs text-cream/50">Open Rooms</p><p className="text-2xl font-black text-cream">{activeRooms}</p></div>
        <div className="card p-5"><p className="text-xs text-cream/50">Messages</p><p className="text-2xl font-black text-cream">{rooms.reduce((sum, room) => sum + room.messages.length, 0)}</p></div>
        <div className="card p-5"><p className="text-xs text-cream/50">Proof Awaiting Review</p><p className="text-2xl font-black text-gold">{awaitingProof}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[620px]">
        <div className="card overflow-hidden">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-cream/50">No operations rooms yet. Accept a gig application to open one.</div>
          ) : rooms.map(room => {
            const last = room.messages[room.messages.length - 1];
            const verified = room.disbursements.filter(d => d.status === 'verified').length;
            return (
              <button key={room.id} onClick={() => setSelectedId(room.id)} className="w-full text-left p-4 border-b hover:bg-white/5 transition-colors" style={{ borderColor: BORDER, background: selected?.id === room.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
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

        <div className="card p-5 flex flex-col">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-cream/50">Select an operations room</div>
          ) : (
            <>
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

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
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
                      disabled={!selected}
                    />
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm font-bold text-cream"><RiMessage2Line /> Beneficiary Status</div>
                  {selected.disbursements.length === 0 ? (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

