export const APP_NAME = 'PayBridge';
export const APP_TAGLINE = 'Get Paid to Disburse Funds — Without Using Your Own Money';
export const PLATFORM_FINCEN = 'MSB Registration #31000245721';
export const DEFAULT_COMMISSION_RATE = 10;
export const MAX_ONBOARDING_STEPS = 6;
export const QUIZ_PASS_THRESHOLD = 80; // 5/6 = ~83%
export const QUIZ_PASS_MIN_CORRECT = 5;
export const QUIZ_TOTAL = 6;

export const ONBOARDING_STEPS = [
  { id: 'profile'   as const, label: 'Personal Info',      description: 'Tell us about yourself' },
  { id: 'training'  as const, label: 'Training',           description: 'Complete all 4 modules' },
  { id: 'quiz'      as const, label: 'Knowledge Quiz',     description: '5/6 correct to pass' },
  { id: 'interview' as const, label: 'Live Interview',     description: '10–15 min session' },
  { id: 'bank'      as const, label: 'Disbursement Account', description: 'Link your dedicated account' },
  { id: 'payout'    as const, label: 'Fee Instructions',   description: 'Confirm worker-fee handling' },
] as const;

export const TRAINING_MODULES = [
  {
    id: 'intro',
    title: 'Platform Overview',
    duration: '3 min',
    description: 'How PayBridge works, your role as a worker, the dashboard, and the pre-funded model.',
  },
  {
    id: 'compliance',
    title: 'Rules & Compliance',
    duration: '5 min',
    description: 'Account segregation, prohibited activities, red flags, AML/OFAC requirements, and reporting.',
  },
  {
    id: 'disbursement',
    title: 'Executing Authorized Disbursements',
    duration: '4 min',
    description: 'Accepting a gig, confirming funding is available, sending from pre-deposited principal, uploading proof.',
  },
  {
    id: 'incidents',
    title: 'What To Do If Something Goes Wrong',
    duration: '3 min',
    description: 'Recipient issues, bank problems, funding delays, suspicious requests — contact support immediately.',
  },
] as const;

export const QUIZ_QUESTIONS = [
  {
    q: 'Your dedicated disbursement account should be used for:',
    options: [
      'PayBridge transactions only',
      'PayBridge transactions + personal bills',
      'Any transactions I want',
      'PayBridge + my other gig work',
    ],
    answer: 0,
  },
  {
    q: 'After disbursing funds to a recipient, you must:',
    options: [
      'Wait for PayBridge to ask for proof',
      'Upload proof immediately (screenshot + TXID)',
      'Nothing — PayBridge tracks it automatically',
      'Call the recipient to confirm',
    ],
    answer: 1,
  },
  {
    q: 'A client asks you to send funds to a recipient you don\'t recognize. What should you do?',
    options: [
      'Send it anyway — the client knows best',
      'Flag it through platform support',
      'Send it and ask questions later',
      'Decline the entire gig without reporting',
    ],
    answer: 1,
  },
  {
    q: 'What happens if you don\'t complete a gig within the deadline?',
    options: [
      'Nothing — deadlines are flexible',
      'Performance impact + possible badge penalty',
      'Automatic extension is granted',
      'The gig is cancelled with no impact',
    ],
    answer: 1,
  },
  {
    q: 'Which of the following is a red flag?',
    options: [
      'Client provides a detailed signed contract',
      'Client asks you to use your personal account',
      'Client asks you to send funds before funding arrives',
      'Both B and C',
    ],
    answer: 3,
  },
  {
    q: 'When does PayBridge make principal funds available for a gig?',
    options: [
      'After I send funds and submit proof',
      'Before I execute any disbursements',
      'At the end of the month',
      'Only after Operations confirms the gig record',
    ],
    answer: 1,
  },
] as const;

export const BADGE_TIERS = [
  {
    id: 'trainee'   as const,
    label: 'Trainee',
    emoji: '',
    color: 'text-cream/60',
    bg: 'bg-cream/5',
    border: 'border-cream/15',
    gigs: [0, 4],
    commission: 10,
    description: 'Getting started — standard gigs',
  },
  {
    id: 'associate' as const,
    label: 'Associate',
    emoji: '',
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/30',
    gigs: [5, 24],
    commission: 10,
    description: 'Verified — standard gigs',
  },
  {
    id: 'senior'    as const,
    label: 'Senior',
    emoji: '',
    color: 'text-gold-light',
    bg: 'bg-gold/14',
    border: 'border-gold/35',
    gigs: [25, 99],
    commission: 11,
    description: 'Trusted — priority gigs',
  },
  {
    id: 'expert'    as const,
    label: 'Expert',
    emoji: '',
    color: 'text-terra',
    bg: 'bg-terra/10',
    border: 'border-terra/30',
    gigs: [100, 499],
    commission: 13,
    description: 'High-value gigs',
  },
  {
    id: 'master'    as const,
    label: 'Elite',
    emoji: '',
    color: 'text-cream',
    bg: 'bg-cream/8',
    border: 'border-cream/30',
    gigs: [500, Infinity],
    commission: 15,
    description: 'Enterprise — top earners',
  },
] as const;

export const PARTNER_BANKS = [
  'Wells Fargo', 'Chase', 'Bank of America', 'USAA', 'Navy Federal',
  'Citibank', 'PNC Bank', 'Capital One', 'TD Bank', 'US Bank',
  'Ally Bank', 'SunTrust', 'Regions Bank', 'Fifth Third', 'KeyBank',
  'Huntington', 'Citizens Bank', 'M&T Bank', 'Synovus', 'First Republic',
  'BBVA', 'Santander', 'TIAA', 'Discover Bank', 'Goldman Sachs (Marcus)',
  'American Express', 'Barclays US', 'HSBC US', 'Flagstar Bank',
] as const;

export const DISBURSEMENT_METHODS = [
  { id: 'zelle',         label: 'Zelle' },
  { id: 'cashapp',       label: 'Cash App' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'paypal',        label: 'PayPal' },
  { id: 'wire',          label: 'Wire Transfer' },
  { id: 'crypto',        label: 'Crypto' },
] as const;

export const PAYOUT_METHODS = [
  { id: 'bank_transfer', label: 'ACH — Personal Bank Account' },
  { id: 'paypal',        label: 'PayPal' },
  { id: 'zelle',         label: 'Zelle' },
  { id: 'cashapp',       label: 'Cash App' },
  { id: 'wire',          label: 'Wire Transfer' },
] as const;
