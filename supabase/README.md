# PayBridge Backend Plan

This folder is the planned Supabase backend for the PayBridge Workers app. The frontend currently runs as a Vite/React app with a hybrid data layer:

- Real Supabase Auth and direct table calls are already wired through `src/lib/supabase.ts` when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.
- Many operational workflows still run through `src/lib/localDb.ts`, a browser `localStorage` mock that powers admin operations, gig applications, support chat, KYC review, notifications, and wallet records.
- `supabase/functions/*` contains Edge Function drafts for funding, disbursement, compliance, identity checks, and commission settlement.
- `supabase/migrations/001_initial_schema.sql` is not ready to apply yet. It is truncated inside the `account_health_checks` table and only covers part of the data model.

The backend work should first make the database authoritative, then replace local mock workflows with Supabase queries, Realtime subscriptions, Storage, and Edge Functions.

## Current Project Shape

```text
paybridge-workers/
  src/
    lib/supabase.ts              # Supabase client with local mock fallback
    lib/localDb.ts               # Current browser-backed operational mock
    types/database.ts            # Frontend domain types
    hooks/                       # Auth, onboarding, gigs, wallet, notifications
    pages/admin/                 # Admin workbench using localDb
    pages/onboarding/            # Mix of Supabase table writes and local mocks
    pages/gigs/                  # Worker gig flow, mostly localDb
  supabase/
    migrations/001_initial_schema.sql
    functions/
      check-account-health/
      complete-gig/
      confirm-funding/
      flag-compliance-review/
      fund-gig/
      link-disbursement-account/
      request-commission-payout/
      settle-commission/
      settle-principal/
      submit-disbursement-proof/
      verify-disbursement/
      verify-worker-identity/
```

## Backend Goals

1. Make Supabase Postgres the source of truth for workers, onboarding, gigs, applications, disbursements, operations chat, support, compliance, notifications, wallet records, and audit logs.
2. Preserve the frontend domain model from `src/types/database.ts` where possible so the UI migration is mechanical.
3. Keep sensitive actions behind Edge Functions using `SUPABASE_SERVICE_ROLE_KEY`; never expose service role keys to the browser.
4. Enforce row-level security on every exposed table.
5. Store uploaded files in Supabase Storage buckets with path-level policies.
6. Add auditability around all money movement, compliance review, KYC, support incidents, and admin decisions.

## Existing Schema Draft

The current migration starts these tables:

- `worker_profiles`
- `worker_documents`
- `worker_gigs`
- `worker_disbursements`
- `funding_events`
- `commission_ledger`
- `commission_payouts`
- `account_health_checks` incomplete

Before running migrations, replace or repair `001_initial_schema.sql`. It currently stops at:

```sql
status acco
```

That means it will fail if applied as-is.

## Missing Schema Needed By The App

The frontend already expects these backend concepts, mostly through `localDb.ts` and `database.ts`:

- `gig_applications`
- `operation_threads`
- `operation_messages`
- `notifications`
- `admin_notifications`
- `notification_preferences`
- `audit_events`
- `support_tickets`
- `support_chat_threads`
- `support_chat_messages`
- `worker_kyc_submissions`
- `worker_bank_accounts`
- `worker_security_settings`
- `worker_signed_documents`
- `storage_objects`
- `disbursement_proofs`
- `compliance_reviews`
- `training_progress`
- `quiz_attempts`
- `interview_slots`

Also align existing enums with frontend types:

- Add `proof_rejected` to disbursement status.
- Add payout methods used by the UI: `zelle`, `cashapp`, `wire`.
- Add a proper `funding_status` enum or text constraint for `worker_gigs`.
- Add gig application status: `submitted`, `under_review`, `accepted`, `declined`.
- Add KYC status: `not_started`, `submitted`, `in_review`, `verified`, `rejected`.

## Recommended Data Modules

### Auth And Profiles

Use Supabase Auth for worker accounts. Create a database trigger on `auth.users` to insert `worker_profiles` from `raw_user_meta_data` fields collected during signup:

- `full_name`
- `phone`
- `country`

Do not use user-editable metadata for authorization. Admin access should be stored in app metadata or a dedicated `admin_users` table controlled by service role operations.

### Workers And Onboarding

Tables:

- `worker_profiles`
- `training_progress`
- `quiz_attempts`
- `interview_slots`
- `worker_bank_accounts`
- `worker_kyc_submissions`
- `worker_signed_documents`
- `worker_security_settings`
- `notification_preferences`

Key rules:

- Workers can read and update only their own profile and onboarding records.
- Admins can review KYC, bank account status, interviews, and compliance status.
- Tax IDs and banking details should never store full sensitive values in regular tables. Keep only last four digits and provider references.

### Gigs And Applications

Tables:

- `worker_gigs`
- `gig_applications`
- `operation_threads`
- `operation_messages`

Target flow:

1. Admin creates an open gig.
2. Worker applies through `gig_applications`.
3. Admin reviews the application.
4. If accepted, assign `worker_gigs.worker_id`, set status to `accepted`, and create an operations thread.
5. Operations uses the thread for funding instructions, worker confirmation, proof review, and incident handling.

### Funding And Disbursement

Tables:

- `funding_events`
- `worker_disbursements`
- `disbursement_proofs`
- `storage_objects`
- `commission_ledger`
- `commission_payouts`

Edge Functions:

- `fund-gig`: record principal funding event.
- `confirm-funding`: confirm funding and move gig to funded state.
- `submit-disbursement-proof`: validate worker ownership and store submitted proof metadata.
- `verify-disbursement`: operations verification of transaction/proof.
- `settle-principal`: close out principal movement after disbursements are verified.
- `complete-gig`: complete gig and create commission ledger entry.
- `request-commission-payout`: request payout against available worker balance.
- `settle-commission`: mark commission as settled.

Money movement should be append-only where possible. Prefer ledger rows and status transitions over destructive updates.

### Compliance And Support

Tables:

- `account_health_checks`
- `compliance_reviews`
- `support_tickets`
- `support_chat_threads`
- `support_chat_messages`
- `audit_events`
- `notifications`
- `admin_notifications`

Target flow:

1. Worker or system reports an incident.
2. Admin/support triages in Inbox.
3. Compliance can flag, suspend, clear, or terminate account access.
4. All decisions write to `audit_events`.
5. Worker and admin notifications are created for meaningful state changes.

## Storage Plan

Create these Supabase Storage buckets:

- `avatars`: public read, owner write.
- `kyc-documents`: private, worker upload, admin read.
- `transaction-proofs`: private, assigned worker upload, admin read.
- `account-documents`: private, worker upload, admin read.

Recommended path format:

```text
avatars/{worker_id}/{timestamp}-{filename}
kyc-documents/{worker_id}/{timestamp}-{filename}
transaction-proofs/{worker_id}/{gig_id}/{disbursement_id}/{filename}
account-documents/{worker_id}/{timestamp}-{filename}
```

Every private upload should also create a `storage_objects` row for audit and UI display.

## Security Model

Enable RLS on every table in the exposed `public` schema.

Worker policies:

- Workers can select their own records by `worker_id = auth.uid()` or `id = auth.uid()`.
- Workers can see open gigs and gigs assigned to them.
- Workers can create applications for themselves.
- Workers can write messages only to threads they belong to.
- Workers can upload KYC and proof files only under their own user path.

Admin policies:

- Use a dedicated admin authorization mechanism, not hardcoded frontend credentials.
- Admin read/write access should be broad enough for operations, but every privileged action should create an audit event.
- Service role Edge Functions may bypass RLS, but each function must explicitly validate the actor, entity ownership, and allowed state transition.

Function hardening:

- Check HTTP method and auth token.
- Validate required JSON body fields.
- Fetch the acting user from the JWT unless the function is intentionally admin-only.
- Return consistent JSON error shapes.
- Avoid blindly trusting `worker_id` supplied by the browser.

## Build Phases

### Phase 1: Repair The Foundation

- Replace the truncated migration with a valid baseline schema.
- Add missing tables and enums from `src/types/database.ts`.
- Add `updated_at` triggers where the UI expects fresh ordering.
- Add RLS policies for worker-owned data.
- Add seed data for local development.
- Generate or manually align frontend database types.

### Phase 2: Auth And Onboarding

- Add `auth.users` trigger for `worker_profiles`.
- Move onboarding writes fully to Supabase.
- Implement Storage policies for avatars and KYC.
- Replace KYC and signed-document localDb methods with Supabase queries.
- Add admin KYC review flow backed by real tables.

### Phase 3: Gigs And Operations

- Move gig listing, applications, reviews, and assignment out of `localDb`.
- Add operations threads and messages in Postgres.
- Use Supabase Realtime for operations chat and notification updates.
- Replace admin gig creation/review flows with Supabase mutations or Edge Functions.

### Phase 4: Funding, Proofs, And Ledger

- Normalize funding status transitions.
- Finish and secure Edge Functions for funding, proof submission, disbursement verification, completion, and commission settlement.
- Add private Storage upload flow for transaction proofs.
- Make wallet data read from `funding_events`, `commission_ledger`, `commission_payouts`, `audit_events`, and `storage_objects`.

### Phase 5: Support, Compliance, And Audit

- Replace support tickets and live chat localDb state with Supabase tables.
- Implement compliance review actions and account health checks.
- Add admin notifications and worker notifications.
- Ensure all sensitive admin actions write audit rows.

### Phase 6: Verification And Deployment

- Run migrations against a fresh local Supabase database.
- Run RLS tests for worker A, worker B, anon, authenticated, admin, and service role paths.
- Test every Edge Function with valid, invalid, unauthorized, and wrong-state inputs.
- Run frontend build: `npm run build`.
- Deploy Edge Functions and set required secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Open Decisions

- Choose the admin authorization model: Supabase app metadata, `admin_users` table, or separate admin auth provider.
- Decide whether operations/support chat should use plain Postgres rows plus Realtime or a dedicated messaging abstraction.
- Decide whether payment rails are manual ledger records first or integrated with a banking/payment provider.
- Decide whether `worker_documents` and `worker_kyc_submissions` should remain separate or merge into one KYC model.
- Decide whether the frontend should keep the mock fallback after production Supabase is complete.

## Immediate Next Step

Start by replacing `001_initial_schema.sql` with a complete baseline migration that matches `src/types/database.ts` and the workflows in `src/lib/localDb.ts`. Once that migration applies cleanly, migrate one vertical slice at a time: Auth/Profile, then Gigs/Applications, then Operations chat, then Funding/Disbursement.
