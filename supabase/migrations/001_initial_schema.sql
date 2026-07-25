-- PayBridge Workers — Initial Schema
-- This migration creates all tables, indexes, RLS policies, and triggers.

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────
CREATE TYPE badge_tier AS ENUM ('trainee', 'associate', 'senior', 'expert', 'master');
CREATE TYPE disbursement_status AS ENUM ('pending', 'sent', 'verified', 'failed');
CREATE TYPE onboarding_step AS ENUM ('profile', 'training', 'quiz', 'interview', 'bank', 'payout');
CREATE TYPE payout_method AS ENUM ('paypal', 'bank_transfer', 'crypto');
CREATE TYPE gig_status AS ENUM ('open', 'accepted', 'funded', 'in_progress', 'completed', 'cancelled');
CREATE TYPE funding_event_type AS ENUM ('deposit', 'withdrawal', 'refund');
CREATE TYPE commission_status AS ENUM ('earned', 'pending_settlement', 'settled', 'withdrawn');
CREATE TYPE account_health_status AS ENUM ('healthy', 'warning', 'flagged', 'suspended');
CREATE TYPE compliance_action AS ENUM ('warning', 'flag', 'suspension', 'termination', 'clearance');

-- ─── Worker Profiles ────────────────────────────────────────
CREATE TABLE worker_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  country         TEXT NOT NULL,
  avatar_url      TEXT,
  badge           badge_tier NOT NULL DEFAULT 'trainee',
  total_gigs_completed INTEGER NOT NULL DEFAULT 0,
  total_disbursed     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned        NUMERIC(12,2) NOT NULL DEFAULT 0,
  rating          NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  onboarding_step onboarding_step NOT NULL DEFAULT 'profile',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  account_health  account_health_status NOT NULL DEFAULT 'healthy',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_profiles_badge ON worker_profiles(badge);
CREATE INDEX idx_worker_profiles_health ON worker_profiles(account_health);
CREATE INDEX idx_worker_profiles_onboarding ON worker_profiles(onboarding_completed) WHERE NOT onboarding_completed;

-- ─── Worker Documents ───────────────────────────────────────
CREATE TABLE worker_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('id_card','passport','drivers_license','proof_of_address','selfie','other')),
  url         TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_documents_worker ON worker_documents(worker_id);

-- ─── Worker Gigs ────────────────────────────────────────────
CREATE TABLE worker_gigs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id           UUID REFERENCES worker_profiles(id),
  client_name         TEXT NOT NULL,
  client_contact      TEXT,
  total_principal     NUMERIC(12,2) NOT NULL CHECK (total_principal > 0),
  commission_rate     NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount   NUMERIC(12,2) GENERATED ALWAYS AS (total_principal * commission_rate / 100) STORED,
  recipient_count     INTEGER NOT NULL CHECK (recipient_count > 0),
  disbursement_methods TEXT[] NOT NULL DEFAULT '{}',
  badge_required      badge_tier,
  status              gig_status NOT NULL DEFAULT 'open',
  deadline            TIMESTAMPTZ NOT NULL,
  accepted_at         TIMESTAMPTZ,
  funded_at           TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  funded              BOOLEAN NOT NULL DEFAULT false,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_worker_gigs_status ON worker_gigs(status);
CREATE INDEX idx_worker_gigs_worker ON worker_gigs(worker_id);
CREATE INDEX idx_worker_gigs_worker_status ON worker_gigs(worker_id, status);
CREATE INDEX idx_worker_gigs_open ON worker_gigs(status, badge_required) WHERE status = 'open';

-- ─── Worker Disbursements ───────────────────────────────────
CREATE TABLE worker_disbursements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id          UUID NOT NULL REFERENCES worker_gigs(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  recipient_name  TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  status          disbursement_status NOT NULL DEFAULT 'pending',
  transaction_id  TEXT,
  proof_url       TEXT,
  notes           TEXT,
  sent_at         TIMESTAMPTZ,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disbursements_gig ON worker_disbursements(gig_id);
CREATE INDEX idx_disbursements_worker ON worker_disbursements(worker_id);
CREATE INDEX idx_disbursements_status ON worker_disbursements(status);
CREATE INDEX idx_disbursements_gig_status ON worker_disbursements(gig_id, status);

-- ─── Funding Events ─────────────────────────────────────────
CREATE TABLE funding_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id      UUID NOT NULL REFERENCES worker_gigs(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type        funding_event_type NOT NULL,
  reference   TEXT NOT NULL,
  confirmed   BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funding_events_gig ON funding_events(gig_id);
CREATE INDEX idx_funding_events_worker ON funding_events(worker_id);

-- ─── Commission Ledger ──────────────────────────────────────
CREATE TABLE commission_ledger (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id   UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  gig_id      UUID NOT NULL REFERENCES worker_gigs(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status      commission_status NOT NULL DEFAULT 'earned',
  settled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_ledger_worker ON commission_ledger(worker_id);
CREATE INDEX idx_commission_ledger_status ON commission_ledger(worker_id, status);

-- ─── Commission Payouts ─────────────────────────────────────
CREATE TABLE commission_payouts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id     UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method        payout_method NOT NULL,
  destination   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  reference     TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX idx_payouts_worker ON commission_payouts(worker_id);
CREATE INDEX idx_payouts_status ON commission_payouts(status);

-- ─── Account Health Checks ──────────────────────────────────
CREATE TABLE account_health_checks (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id               UUID NOT NULL UNIQUE REFERENCES worker_profiles(id) ON DELETE CASCADE,
  disbursement_account_type TEXT NOT NULL CHECK (disbursement_account_type IN ('dedicated','shared','unknown')),
  last_verified           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_check              TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status                  acco
