import { FormEvent, useState } from 'react';
import { AlertTriangle, CheckCircle, Edit3, Landmark, Plus, Save, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { PARTNER_BANKS } from '../../lib/constants';
import { localDb } from '../../lib/localDb';
import { WorkerBankAccount, WorkerBankAccountType } from '../../types/database';

const accountTypeOptions: { value: WorkerBankAccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'business_checking', label: 'Business Checking' },
];

const emptyForm = {
  bankName: '',
  accountLabel: '',
  accountType: 'checking' as WorkerBankAccountType,
  accountNumber: '',
  routingNumber: '',
  makePrimary: false,
};

interface BankAccountsManagerProps {
  workerId: string;
  onboarding?: boolean;
  onReadyChange?: (ready: boolean) => void;
}

export function BankAccountsManager({ workerId, onboarding = false, onReadyChange }: BankAccountsManagerProps) {
  const [accounts, setAccounts] = useState<WorkerBankAccount[]>(() => localDb.listBankAccounts(workerId));
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const bankGroups = Object.entries(
    accounts.reduce<Record<string, WorkerBankAccount[]>>((grouped, account) => {
      grouped[account.bank_name] = grouped[account.bank_name] ?? [];
      grouped[account.bank_name].push(account);
      return grouped;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  function refresh() {
    const next = localDb.listBankAccounts(workerId);
    setAccounts(next);
    onReadyChange?.(next.length > 0);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleAddAccount(e: FormEvent) {
    e.preventDefault();
    if (!form.bankName) {
      toast.error('Choose a partner bank');
      return;
    }

    try {
      localDb.addBankAccount({
        workerId,
        bankName: form.bankName,
        accountLabel: form.accountLabel,
        accountType: form.accountType,
        accountNumber: form.accountNumber,
        routingNumber: form.routingNumber,
        makePrimary: form.makePrimary || accounts.length === 0,
      });
      resetForm();
      refresh();
      toast.success('Bank account added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add bank account');
    }
  }

  function startEdit(account: WorkerBankAccount) {
    setEditingId(account.id);
    setForm({
      bankName: account.bank_name,
      accountLabel: account.account_label,
      accountType: account.account_type,
      accountNumber: '',
      routingNumber: '',
      makePrimary: account.is_primary,
    });
  }

  function handleUpdateAccount(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    try {
      localDb.updateBankAccount(editingId, workerId, {
        bankName: form.bankName,
        accountLabel: form.accountLabel,
        accountType: form.accountType,
        makePrimary: form.makePrimary,
      });
      resetForm();
      refresh();
      toast.success('Bank account updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update bank account');
    }
  }

  function handleDeleteAccount(accountId: string) {
    try {
      localDb.deleteBankAccount(accountId, workerId);
      setDeleteId(null);
      refresh();
      toast.success('Bank account removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove bank account');
    }
  }

  return (
    <div className="space-y-5">
      <Card padding="md">
        <div className="flex items-center gap-3">
          <Landmark size={18} className="text-gold" />
          <h2 className="font-bold text-cream">{onboarding ? 'Add Bank Accounts' : 'Bank Accounts'}</h2>
        </div>
      </Card>

      <Card padding="md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-cream text-sm">Dedicated Accounts</h3>
            <p className="text-xs text-cream/45">{accounts.length} account{accounts.length === 1 ? '' : 's'} on file</p>
          </div>
          {accounts.some(account => account.is_primary) && (
            <span className="status-verified flex items-center gap-1"><CheckCircle size={11} /> Ready</span>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="rounded border border-white/8 p-4 text-sm text-cream/50">No bank accounts added yet.</div>
        ) : (
          <div className="space-y-5">
            {bankGroups.map(([bankName, bankAccounts]) => (
              <div key={bankName} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-cream">{bankName}</p>
                  <span className="text-xs text-cream/40">{bankAccounts.length} account{bankAccounts.length === 1 ? '' : 's'}</span>
                </div>
                {bankAccounts.map(account => (
                  <div key={account.id} className="rounded border border-white/8 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-cream">{account.account_label}</p>
                          {account.is_primary && <span className="status-verified flex items-center gap-1"><Star size={11} /> Primary</span>}
                        </div>
                        <p className="mt-1 text-xs text-cream/50">
                          {account.account_type.replace('_', ' ')} ending {account.account_last4} - routing ending {account.routing_last4}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" variant="secondary" icon={<Edit3 size={13} />} onClick={() => startEdit(account)}>Edit</Button>
                        <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" icon={<Trash2 size={13} />} onClick={() => setDeleteId(account.id)}>Delete</Button>
                      </div>
                    </div>
                    {deleteId === account.id && (
                      <div className="mt-3 flex flex-col gap-3 rounded border border-red-400/20 bg-red-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2 text-xs text-red-300">
                          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Remove this account?</span>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => handleDeleteAccount(account.id)}>Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <form onSubmit={editingId ? handleUpdateAccount : handleAddAccount} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-cream text-sm">{editingId ? 'Edit Account' : 'Add Account'}</h3>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-cream/45 hover:text-cream" aria-label="Cancel edit">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="label-caps mb-1.5 block">Bank</label>
            <select
              value={form.bankName}
              onChange={e => setForm(prev => ({ ...prev, bankName: e.target.value }))}
              className="input-dark appearance-none"
              required
            >
              <option value="">Select bank</option>
              {PARTNER_BANKS.map(bank => (
                <option key={bank} value={bank} className="bg-[#1e1c35]">{bank}</option>
              ))}
            </select>
          </div>

          <Input
            label="Account Nickname"
            placeholder="Dedicated checking"
            value={form.accountLabel}
            onChange={e => setForm(prev => ({ ...prev, accountLabel: e.target.value }))}
            required
          />
          <Select
            label="Account Type"
            value={form.accountType}
            onChange={e => setForm(prev => ({ ...prev, accountType: e.target.value as WorkerBankAccountType }))}
            options={accountTypeOptions}
          />

          {!editingId && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Account Number"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Numbers only"
                value={form.accountNumber}
                onChange={e => setForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                required
              />
              <Input
                label="Routing Number"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Numbers only"
                value={form.routingNumber}
                onChange={e => setForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                required
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded border border-white/8 p-3">
            <input
              type="checkbox"
              className="mt-0.5 accent-gold"
              checked={form.makePrimary}
              onChange={e => setForm(prev => ({ ...prev, makePrimary: e.target.checked }))}
            />
            <span className="block text-sm font-semibold text-cream">Primary disbursement account</span>
          </label>

          <div className="flex justify-end">
            <Button type="submit" icon={editingId ? <Save size={15} /> : <Plus size={15} />} disabled={!form.bankName}>
              {editingId ? 'Save Account' : 'Add Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
