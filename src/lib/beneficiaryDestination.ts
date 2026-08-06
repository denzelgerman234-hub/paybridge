export type DestinationFieldType = 'text' | 'select';

export type DestinationField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: DestinationFieldType;
  options?: string[];
};

export type DestinationMethodConfig = {
  title: string;
  fields: DestinationField[];
};

const CRYPTO_ASSETS = ['USDT', 'USDC', 'Bitcoin'] as const;
const STABLECOIN_NETWORKS = ['Ethereum (ERC-20)', 'BNB Smart Chain (BEP-20)', 'Tron (TRC-20)'] as const;
const BITCOIN_NETWORKS = ['Bitcoin'] as const;

export const DESTINATION_METHOD_CONFIG: Record<string, DestinationMethodConfig> = {
  bank_transfer: {
    title: 'Bank transfer details',
    fields: [
      { key: 'bank_name', label: 'Bank name', placeholder: 'Chase', required: true },
      { key: 'account_holder', label: 'Account holder', placeholder: 'Recipient legal name', required: true },
      { key: 'account_type', label: 'Account type', type: 'select', options: ['Checking', 'Savings'], required: true },
      { key: 'account_number', label: 'Account number', placeholder: 'Full account number', required: true },
      { key: 'routing_number', label: 'Routing number', placeholder: '9-digit routing number', required: true },
    ],
  },
  wire: {
    title: 'Wire transfer details',
    fields: [
      { key: 'bank_name', label: 'Bank name', placeholder: 'Receiving bank', required: true },
      { key: 'account_holder', label: 'Account holder', placeholder: 'Recipient legal name', required: true },
      { key: 'account_number', label: 'Account number', placeholder: 'Full account number', required: true },
      { key: 'routing_number', label: 'Routing number', placeholder: 'Wire routing number', required: true },
      { key: 'bank_address', label: 'Bank address', placeholder: 'Street, city, state', required: true },
      { key: 'swift_bic', label: 'SWIFT/BIC', placeholder: 'Optional for domestic wires' },
      { key: 'memo', label: 'Memo / reference', placeholder: 'Optional instructions' },
    ],
  },
  cashapp: {
    title: 'Cash App details',
    fields: [
      { key: 'cashtag', label: 'Cashtag', placeholder: '$recipient', required: true },
    ],
  },
  zelle: {
    title: 'Zelle details',
    fields: [
      { key: 'zelle_contact', label: 'Zelle email or phone', placeholder: 'recipient@email.com or +1...', required: true },
    ],
  },
  paypal: {
    title: 'PayPal details',
    fields: [
      { key: 'paypal_email', label: 'PayPal email', placeholder: 'recipient@email.com', required: true },
    ],
  },
  crypto: {
    title: 'Crypto details',
    fields: [
      { key: 'asset', label: 'Asset', type: 'select', options: [...CRYPTO_ASSETS], required: true },
      { key: 'network', label: 'Network', type: 'select', options: [...STABLECOIN_NETWORKS], required: true },
      { key: 'wallet_address', label: 'Wallet address', placeholder: 'Recipient wallet address', required: true },
      { key: 'memo', label: 'Memo / tag', placeholder: 'Only if required by wallet or exchange' },
    ],
  },
};

export function getDestinationConfig(method: string) {
  return DESTINATION_METHOD_CONFIG[method] ?? {
    title: 'Destination details',
    fields: [{ key: 'destination', label: 'Destination', placeholder: 'Account, handle, or address', required: true }],
  };
}

export function getCryptoNetworks(asset: string): string[] {
  return asset === 'Bitcoin' ? [...BITCOIN_NETWORKS] : [...STABLECOIN_NETWORKS];
}

export function parseDestination(destination: string) {
  const values: Record<string, string> = {};
  destination.split('\n').forEach(line => {
    const [label, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (label?.trim() && value) values[label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')] = value;
  });
  return values;
}

export function formatDestination(method: string, values: Record<string, string>) {
  return getDestinationConfig(method).fields
    .map(field => ({ label: field.label, value: (values[field.key] ?? '').trim() }))
    .filter(item => item.value)
    .map(item => `${item.label}: ${item.value}`)
    .join('\n');
}

export function hasRequiredDestinationFields(method: string, destination: string) {
  const values = parseDestination(destination);
  return getDestinationConfig(method).fields.every(field => !field.required || Boolean(values[field.key]?.trim()));
}
