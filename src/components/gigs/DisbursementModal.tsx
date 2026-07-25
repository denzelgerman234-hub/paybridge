import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DISBURSEMENT_METHODS } from '../../lib/constants';
import { RiShieldCheckLine, RiUploadLine } from 'react-icons/ri';

const SAGE  = '#7DC99A';
const TERRA = '#C8523D';
const DIM   = 'rgba(241,240,218,0.45)';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { recipient_name: string; amount: number; method: string; destination: string; transaction_id: string }) => Promise<void>;
  maxAmount?: number;
}

export function DisbursementModal({ isOpen, onClose, onSubmit, maxAmount }: Props) {
  const [form, setForm] = useState({ recipient_name: '', amount: '', method: 'bank_transfer', destination: '', transaction_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
    if (maxAmount && amount > maxAmount) { setError(`Cannot exceed ${maxAmount.toFixed(2)} (remaining principal)`); return; }
    setError(''); setLoading(true);
    await onSubmit({ ...form, amount });
    setLoading(false);
    setForm({ recipient_name: '', amount: '', method: 'bank_transfer', destination: '', transaction_id: '' });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Disbursement" size="md">
      {/* Compliance reminder */}
      <div
        className="flex items-start gap-2.5 p-3 mb-5"
        style={{ background: 'rgba(125,201,154,0.06)', border: '1px solid rgba(125,201,154,0.2)', borderLeft: `3px solid ${SAGE}`, borderRadius: 4 }}
      >
        <RiShieldCheckLine style={{ color: SAGE, fontSize: 16, flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs" style={{ color: DIM }}>
          Only disburse from <strong style={{ color: SAGE }}>pre-deposited principal</strong>. Never use your personal funds.
          Upload proof immediately after sending.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Recipient Name" value={form.recipient_name} onChange={up('recipient_name')} placeholder="Full name" required />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (USD)" type="number" min="0.01" step="0.01" value={form.amount} onChange={up('amount')} placeholder="0.00" required />
          <div className="space-y-1.5">
            <label className="label-caps block">Method</label>
            <select value={form.method} onChange={up('method')} className="input-dark appearance-none">
              {DISBURSEMENT_METHODS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#12203F' }}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Destination"
          value={form.destination}
          onChange={up('destination')}
          placeholder={form.method === 'bank_transfer' ? 'Account number' : form.method === 'paypal' ? 'PayPal email' : 'Address'}
          required
        />
        <Input
          label="Transaction ID / Reference"
          value={form.transaction_id}
          onChange={up('transaction_id')}
          placeholder="TXID-XXXXXX"
          hint="Screenshot + TXID required after sending"
        />

        {error && <p className="text-xs" style={{ color: TERRA }}>{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} className="flex-1" icon={<RiUploadLine style={{ fontSize: 15 }} />}>
            Record Disbursement
          </Button>
        </div>
      </form>
    </Modal>
  );
}
