/**
 * Admin mock data — simulates the admin-side view of all workers,
 * applications, gigs, disbursements, and commissions.
 */

import { WorkerProfile, WorkerGig, WorkerDisbursement, CommissionLedger, FundingEvent } from '../types/database';

export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface WorkerApplication {
  id: string;
  worker_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  occupation: string;
  why: string;
  bank: string;
  methods: string[];
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

const daysAgo   = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

export const ADMIN_USER = { id: 'admin-001', email: 'admin@paybridge.work', name: 'PayBridge Admin' };

export const MOCK_APPLICATIONS: WorkerApplication[] = [
  {
    id: 'app-001',
    worker_id: null,
    full_name: 'Danielle Carter',
    email: 'danielle.c@email.com',
    phone: '+1 555 200 3311',
    country: 'United States',
    city: 'Atlanta',
    occupation: 'Employed part-time',
    why: 'I have experience in financial services and want to earn supplemental income.',
    bank: 'Chase',
    methods: ['bank_transfer', 'zelle'],
    status: 'pending',
    submitted_at: daysAgo(1),
    reviewed_at: null,
    reviewed_by: null,
    notes: null,
  },
  {
    id: 'app-002',
    worker_id: null,
    full_name: 'Emmanuel Adu',
    email: 'e.adu@email.com',
    phone: '+1 555 411 7722',
    country: 'United States',
    city: 'Denver',
    occupation: 'Self-employed',
    why: 'I have US banking experience and want to support verified disbursement work through PayBridge.',
    bank: 'Wells Fargo',
    methods: ['cashapp', 'paypal', 'bank_transfer'],
    status: 'in_review',
    submitted_at: daysAgo(3),
    reviewed_at: daysAgo(1),
    reviewed_by: 'admin-001',
    notes: 'Strong background. Awaiting manual ID review.',
  },
  {
    id: 'app-003',
    worker_id: 'worker-002',
    full_name: 'Sofia Reyes',
    email: 'sofia.r@email.com',
    phone: '+1 555 800 4455',
    country: 'United States',
    city: 'Houston',
    occupation: 'Employed full-time',
    why: 'Looking for flexible side income. My day job is in banking.',
    bank: 'Bank of America',
    methods: ['bank_transfer', 'zelle', 'paypal'],
    status: 'approved',
    submitted_at: daysAgo(10),
    reviewed_at: daysAgo(7),
    reviewed_by: 'admin-001',
    notes: null,
  },
  {
    id: 'app-004',
    worker_id: null,
    full_name: 'Kwame Boateng',
    email: 'k.boateng@email.com',
    phone: '+1 555 123 4567',
    country: 'United States',
    city: 'Phoenix',
    occupation: 'Student',
    why: 'Interested in financial technology and want to learn the industry.',
    bank: 'Ally Bank',
    methods: ['bank_transfer'],
    status: 'rejected',
    submitted_at: daysAgo(15),
    reviewed_at: daysAgo(12),
    reviewed_by: 'admin-001',
    notes: 'Manual identity review failed - ID mismatch.',
  },
  {
    id: 'app-005',
    worker_id: null,
    full_name: 'Marcus Webb',
    email: 'marcus.w@email.com',
    phone: '+1 555 901 2233',
    country: 'United States',
    city: 'Chicago',
    occupation: 'Employed full-time',
    why: 'Great earning opportunity. Have experience with PayPal business disbursements.',
    bank: 'Navy Federal',
    methods: ['paypal', 'bank_transfer', 'cashapp'],
    status: 'pending',
    submitted_at: daysAgo(0),
    reviewed_at: null,
    reviewed_by: null,
    notes: null,
  },
];

export const MOCK_ALL_WORKERS: (WorkerProfile & { email: string })[] = [
  {
    id: 'mock-user-001',
    full_name: 'Alex Johnson',
    email: 'alex@test.com',
    phone: '+1 555 000 1234',
    country: 'US',
    avatar_url: null,
    badge: 'associate',
    total_gigs_completed: 7,
    total_disbursed: 14250,
    total_earned: 1567.50,
    rating: 4.6,
    onboarding_step: 'payout',
    onboarding_completed: true,
    account_health: 'healthy',
    created_at: daysAgo(60),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'worker-002',
    full_name: 'Sofia Reyes',
    email: 'sofia.r@email.com',
    phone: '+1 555 800 4455',
    country: 'US',
    avatar_url: null,
    badge: 'trainee',
    total_gigs_completed: 1,
    total_disbursed: 8500,
    total_earned: 850,
    rating: 5.0,
    onboarding_step: 'payout',
    onboarding_completed: true,
    account_health: 'healthy',
    created_at: daysAgo(7),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'worker-003',
    full_name: 'James Okonkwo',
    email: 'james.ok@email.com',
    phone: '+1 555 677 2211',
    country: 'US',
    avatar_url: null,
    badge: 'senior',
    total_gigs_completed: 32,
    total_disbursed: 290000,
    total_earned: 33350,
    rating: 4.9,
    onboarding_step: 'payout',
    onboarding_completed: true,
    account_health: 'healthy',
    created_at: daysAgo(180),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'worker-004',
    full_name: 'Priya Sharma',
    email: 'priya.s@email.com',
    phone: '+1 555 344 8890',
    country: 'US',
    avatar_url: null,
    badge: 'associate',
    total_gigs_completed: 9,
    total_disbursed: 38000,
    total_earned: 4180,
    rating: 4.4,
    onboarding_step: 'payout',
    onboarding_completed: true,
    account_health: 'warning',
    created_at: daysAgo(45),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_ALL_GIGS: WorkerGig[] = [
  { id: 'gig-001', worker_id: 'mock-user-001', client_name: 'Acme Corp', client_contact: 'hr@acmecorp.com', total_principal: 12000, commission_rate: 10, commission_amount: 1200, recipient_count: 6, disbursement_methods: ['bank_transfer', 'zelle'], badge_required: 'trainee', status: 'completed', deadline: daysAgo(5), accepted_at: daysAgo(30), funded_at: daysAgo(29), completed_at: daysAgo(5), funded: true, notes: 'Monthly contractor pay.', created_at: daysAgo(35), updated_at: daysAgo(5) },
  { id: 'gig-002', worker_id: null, client_name: 'BrightPath NGO', client_contact: 'ops@brightpath.org', total_principal: 8500, commission_rate: 10, commission_amount: 850, recipient_count: 5, disbursement_methods: ['bank_transfer', 'cashapp'], badge_required: null, status: 'open', deadline: daysAhead(10), accepted_at: null, funded_at: null, completed_at: null, funded: false, notes: 'Stipend payments.', created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: 'gig-003', worker_id: 'mock-user-001', client_name: 'GlobalTrade Ltd', client_contact: 'finance@globaltrade.io', total_principal: 18500, commission_rate: 10, commission_amount: 1850, recipient_count: 8, disbursement_methods: ['paypal', 'bank_transfer'], badge_required: 'associate', status: 'in_progress', deadline: daysAhead(4), accepted_at: daysAgo(10), funded_at: daysAgo(9), completed_at: null, funded: true, notes: 'Vendor payments Q3.', created_at: daysAgo(12), updated_at: daysAgo(1) },
  { id: 'gig-004', worker_id: null, client_name: 'Meridian Health', client_contact: 'payroll@meridian.com', total_principal: 22000, commission_rate: 10, commission_amount: 2200, recipient_count: 11, disbursement_methods: ['bank_transfer', 'zelle'], badge_required: 'associate', status: 'open', deadline: daysAhead(14), accepted_at: null, funded_at: null, completed_at: null, funded: false, notes: 'Bi-weekly payroll.', created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: 'gig-005', worker_id: 'worker-002', client_name: 'Redwood Capital', client_contact: 'ops@redwoodcap.io', total_principal: 5000, commission_rate: 10, commission_amount: 500, recipient_count: 3, disbursement_methods: ['bank_transfer'], badge_required: null, status: 'funded', deadline: daysAhead(3), accepted_at: daysAgo(2), funded_at: daysAgo(1), completed_at: null, funded: true, notes: 'Referral bonuses.', created_at: daysAgo(3), updated_at: daysAgo(1) },
  { id: 'gig-006', worker_id: 'worker-003', client_name: 'TechNova Inc', client_contact: 'finance@technova.io', total_principal: 45000, commission_rate: 11, commission_amount: 4950, recipient_count: 22, disbursement_methods: ['bank_transfer', 'paypal'], badge_required: 'senior', status: 'completed', deadline: daysAgo(2), accepted_at: daysAgo(20), funded_at: daysAgo(18), completed_at: daysAgo(2), funded: true, notes: 'Q3 contractor payments.', created_at: daysAgo(25), updated_at: daysAgo(2) },
];

