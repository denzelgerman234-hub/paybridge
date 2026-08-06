import { useEffect, useMemo } from 'react';
import { formatDestination, getCryptoNetworks, getDestinationConfig, parseDestination } from '../../lib/beneficiaryDestination';

type BeneficiaryDestinationFieldsProps = {
  method: string;
  destination: string;
  onChange: (destination: string) => void;
};

export function BeneficiaryDestinationFields({ method, destination, onChange }: BeneficiaryDestinationFieldsProps) {
  const config = getDestinationConfig(method);
  const values = useMemo(() => parseDestination(destination), [destination]);
  const asset = values.asset || 'USDT';
  const networkOptions = method === 'crypto' ? getCryptoNetworks(asset) : [];

  useEffect(() => {
    const next = { ...values };
    let changed = false;

    config.fields.forEach(field => {
      if (field.type === 'select' && !next[field.key] && field.options?.[0]) {
        next[field.key] = field.options[0];
        changed = true;
      }
    });

    if (method === 'crypto') {
      next.asset = next.asset || asset;
      const nextNetworks = getCryptoNetworks(next.asset);
      if (!next.network || !nextNetworks.includes(next.network)) {
        next.network = nextNetworks[0];
        changed = true;
      }
    }

    if (changed) onChange(formatDestination(method, next));
  }, [asset, method]);

  function updateField(key: string, value: string) {
    const next = { ...values, [key]: value };
    if (method === 'crypto' && key === 'asset') {
      next.network = getCryptoNetworks(value)[0];
    }
    onChange(formatDestination(method, next));
  }

  return (
    <div className="space-y-2 rounded border border-white/8 bg-white/[0.02] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cream/45">{config.title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {config.fields.map(field => {
          const options = method === 'crypto' && field.key === 'network' ? networkOptions : field.options;
          return (
            <div key={field.key} className={field.key === 'wallet_address' || field.key === 'bank_address' || field.key === 'memo' ? 'sm:col-span-2' : ''}>
              {field.type === 'select' ? (
                <select
                  className="input-dark appearance-none text-xs"
                  value={values[field.key] || options?.[0] || ''}
                  onChange={event => updateField(field.key, event.target.value)}
                  required={field.required}
                >
                  {(options ?? []).map(option => <option key={option} value={option} className="bg-[#1e1c35]">{option}</option>)}
                </select>
              ) : (
                <input
                  className="input-dark text-xs"
                  value={values[field.key] ?? ''}
                  onChange={event => updateField(field.key, event.target.value)}
                  placeholder={`${field.placeholder ?? field.label}${field.required ? ' *' : ''}`}
                  required={field.required}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
