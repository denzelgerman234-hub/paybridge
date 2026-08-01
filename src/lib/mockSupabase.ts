/**
 * ============================================================
 *  MOCK SUPABASE CLIENT
 *  Mimics @supabase/supabase-js API surface using in-memory
 *  local data so the app works without real Supabase credentials.
 *
 *  TODO: Once your Supabase project is ready, replace this
 *  entire file with:
 *
 *    import { createClient } from '@supabase/supabase-js';
 *    export const supabase = createClient(
 *      import.meta.env.VITE_SUPABASE_URL,
 *      import.meta.env.VITE_SUPABASE_ANON_KEY,
 *    );
 *
 *  And set real values in your .env file.
 *
 *  LOCAL DEV AUTH FLOW
 *  To test the full auth journey in mock mode:
 *
 *  1. Sign up with any email/password -> navigates to /verify-email
 *  2. Try to sign in with the same email -> gets "Email not confirmed" error
 *  3. To simulate a verified session, navigate to:
 *       /auth/callback?token_hash=valid&type=email
 *  4. To simulate an expired link:
 *       /auth/callback?token_hash=expired&type=email
 *  5. To simulate an already-used link:
 *       /auth/callback?token_hash=used&type=email
 *  6. Any other token_hash -> invalid link state
 * ============================================================
 */

import {
  MOCK_USER_ID,
  MOCK_PROFILE,
  MOCK_GIGS,
  MOCK_DISBURSEMENTS,
  MOCK_COMMISSIONS,
  MOCK_PAYOUTS,
  MOCK_FUNDING_EVENTS,
} from './mockData';

// ---------------------------------------------------------------------------
// In-memory session state
// ---------------------------------------------------------------------------
let _session: { user: { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } } | null = null;
type AuthListener = (event: string, session: typeof _session) => void;
const _authListeners: AuthListener[] = [];

/**
 * Users who have signed up but not yet "verified" their email.
 * In mock mode, sign-in for these users will return an email_not_confirmed error.
 */
const _pendingVerification = new Map<string, { id: string; password: string; profile: Record<string, unknown> }>();
const _verifiedUsers = new Map<string, { id: string; password: string; profile: Record<string, unknown> }>();

function _notifyAuth(event: string) {
  _authListeners.forEach((fn) => fn(event, _session));
}

// ---------------------------------------------------------------------------
// Tiny in-memory "database" keyed by table name
// ---------------------------------------------------------------------------
const DB: Record<string, Record<string, unknown>[]> = {
  worker_profiles: [MOCK_PROFILE as unknown as Record<string, unknown>],
  worker_gigs: MOCK_GIGS as unknown as Record<string, unknown>[],
  worker_disbursements: MOCK_DISBURSEMENTS as unknown as Record<string, unknown>[],
  commission_ledger: MOCK_COMMISSIONS as unknown as Record<string, unknown>[],
  commission_payouts: MOCK_PAYOUTS as unknown as Record<string, unknown>[],
  funding_events: MOCK_FUNDING_EVENTS as unknown as Record<string, unknown>[],
  training_progress: [],
  quiz_attempts: [],
  interview_slots: [],
  account_health_checks: [],
  notification_preferences: [{
    id: 'notif-pref-001',
    worker_id: MOCK_USER_ID,
    email_new_gig: true,
    email_disbursement: true,
    email_fee_record: true,
    email_compliance: true,
    sms_disbursement: false,
    push_new_gig: true,
    push_disbursement: true,
  }],
  worker_security_settings: [{
    id: 'security-001',
    worker_id: MOCK_USER_ID,
    two_factor_enabled: false,
    two_factor_method: null,
    two_factor_enabled_at: null,
    updated_at: new Date().toISOString(),
  }],
  worker_bank_accounts: [],
  worker_kyc_submissions: [],
  worker_signed_documents: [],
  storage_objects: [],
};

// Helper to get table rows (returns copy to avoid mutations leaking)
function getTable(name: string): Record<string, unknown>[] {
  return DB[name] ? [...DB[name]] : [];
}

// ---------------------------------------------------------------------------
// Query builder - fluent API that resolves lazily
// ---------------------------------------------------------------------------
type QueryResult<T> = { data: T | null; error: null };

class QueryBuilder<T = Record<string, unknown>> {
  private _table: string;
  private _filters: Array<{ key: string; value: unknown }> = [];
  private _orderKey: string | null = null;
  private _orderAsc = true;
  private _single = false;
  private _updateData: Partial<Record<string, unknown>> | null = null;
  private _insertData: Partial<Record<string, unknown>> | Partial<Record<string, unknown>>[] | null = null;
  private _upsertData: Partial<Record<string, unknown>> | Partial<Record<string, unknown>>[] | null = null;
  private _upsertConflictKeys: string[] | null = null;
  private _isDelete = false;

  constructor(table: string) {
    this._table = table;
  }

  select(_columns = '*'): this { return this; }

  eq(key: string, value: unknown): this {
    this._filters.push({ key, value });
    return this;
  }

  order(key: string, opts?: { ascending?: boolean }): this {
    this._orderKey = key;
    this._orderAsc = opts?.ascending !== false;
    return this;
  }

  single(): this { this._single = true; return this; }

  update(data: Partial<Record<string, unknown>>): this {
    this._updateData = data;
    return this;
  }

  insert(data: Partial<Record<string, unknown>> | Partial<Record<string, unknown>>[]): this {
    this._insertData = data;
    return this;
  }

  upsert(data: Partial<Record<string, unknown>> | Partial<Record<string, unknown>>[], opts?: { onConflict?: string }): this {
    this._upsertData = data;
    this._upsertConflictKeys = opts?.onConflict?.split(',').map(key => key.trim()).filter(Boolean) ?? null;
    return this;
  }

  delete(): this { this._isDelete = true; return this; }

  // Resolve promise
  then<TResult>(
    onfulfilled: (value: QueryResult<T>) => TResult,
  ): Promise<TResult> {
    return Promise.resolve(this._resolve() as QueryResult<T>).then(onfulfilled);
  }

  private _resolve(): QueryResult<unknown> {
    const table = this._table;

    if (this._insertData) {
      const inputs = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      const rows = inputs.map(input => ({
        id: input['id'] ?? crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...input,
      }));
      DB[table] = DB[table] ? [...DB[table], ...rows] : rows;
      return { data: Array.isArray(this._insertData) ? rows : rows[0], error: null };
    }

    if (this._upsertData) {
      const inputs = Array.isArray(this._upsertData) ? this._upsertData : [this._upsertData];
      const keys = this._upsertConflictKeys?.length ? this._upsertConflictKeys : ['id'];
      DB[table] = DB[table] ?? [];
      const rows = inputs.map(input => {
        const idx = DB[table].findIndex(row => keys.every(key => row[key] === input[key]));
        const next = {
          id: input['id'] ?? (idx >= 0 ? DB[table][idx]['id'] : crypto.randomUUID()),
          created_at: idx >= 0 ? DB[table][idx]['created_at'] : new Date().toISOString(),
          ...input,
          updated_at: new Date().toISOString(),
        };
        if (idx >= 0) {
          DB[table][idx] = { ...DB[table][idx], ...next };
        } else {
          DB[table].push(next);
        }
        return next;
      });
      return { data: Array.isArray(this._upsertData) ? rows : rows[0], error: null };
    }

    let rows = getTable(table);

    if (this._updateData) {
      const updates = this._updateData;
      rows = rows.map((r) => {
        const matches = this._filters.every(({ key, value }) => r[key] === value);
        return matches ? { ...r, ...updates, updated_at: new Date().toISOString() } : r;
      });
      DB[table] = rows;
      return { data: rows, error: null };
    }

    if (this._isDelete) {
      DB[table] = rows.filter((r) =>
        !this._filters.every(({ key, value }) => r[key] === value)
      );
      return { data: null, error: null };
    }

    // SELECT
    rows = rows.filter((r) =>
      this._filters.every(({ key, value }) => r[key] === value)
    );

    if (this._orderKey) {
      const key = this._orderKey;
      rows = [...rows].sort((a, b) => {
        const av = a[key] as string, bv = b[key] as string;
        return this._orderAsc ? av?.localeCompare(bv) : bv?.localeCompare(av);
      });
    }

    if (this._single) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }
}

// ---------------------------------------------------------------------------
// Mock Supabase client (matches the subset of the API used by this app)
// ---------------------------------------------------------------------------
export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    onAuthStateChange(fn: AuthListener) {
      _authListeners.push(fn);
      // Immediately fire with current session (mirrors Supabase behaviour)
      setTimeout(() => fn('INITIAL_SESSION', _session), 0);
      return { data: { subscription: { unsubscribe: () => {
        const idx = _authListeners.indexOf(fn);
        if (idx >= 0) _authListeners.splice(idx, 1);
      }}}, error: null };
    },

    async getSession() {
      return { data: { session: _session }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (!email || !password) return { error: { message: 'Email and password required' } };

      // Check if this email is in the pending-verification pool (signed up but not verified)
      if (_pendingVerification.has(email)) {
        return {
          error: {
            code: 'email_not_confirmed',
            message: 'Email not confirmed',
          },
        };
      }

      const verifiedUser = _verifiedUsers.get(email);
      _session = {
        user: {
          id: verifiedUser?.id ?? MOCK_USER_ID,
          email,
          app_metadata: {},
          user_metadata: { full_name: 'PayBridge Worker' },
        },
      };
      // Update the profile's id to match (in case email changed)
      const prof = DB.worker_profiles.find((p) => p['id'] === (verifiedUser?.id ?? MOCK_USER_ID));
      if (prof) (prof as Record<string, unknown>)['email'] = email;
      _notifyAuth('SIGNED_IN');
      return { error: null };
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      // Create a new mock profile but do NOT create a session.
      // The user must "verify" their email first (via /auth/callback?token_hash=valid).
      const id = crypto.randomUUID();
      const newProfile: Record<string, unknown> = {
        id,
        full_name: options?.data?.['full_name'] ?? 'New Worker',
        phone: options?.data?.['phone'] ?? '',
        country: options?.data?.['country'] ?? '',
        avatar_url: null,
        badge: 'trainee',
        total_gigs_completed: 0,
        total_disbursed: 0,
        total_earned: 0,
        rating: 0,
        onboarding_step: 'profile',
        onboarding_completed: false,
        account_health: 'healthy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store in pending pool - sign-in will be blocked until verified
      _pendingVerification.set(email, { id, password, profile: newProfile });
      DB.worker_profiles.push(newProfile);

      // Do NOT notify SIGNED_IN - the user must verify their email first.
      return { data: { user: { id, email, email_confirmed_at: null }, session: null }, error: null };
    },

    /**
     * Simulates resending the verification email.
     * In mock mode this always succeeds. The real verification still happens
     * via /auth/callback?token_hash=valid.
     */
    async resend({ type: _type, email }: { type: string; email: string }) {
      if (!_pendingVerification.has(email)) {
        // If not in pending pool, already verified - treat as success silently
        return { error: null };
      }
      // Simulate email resent successfully
      return { error: null };
    },

    /**
     * Simulates clicking a verification link.
     * token_hash values and their outcomes:
     *   'valid'   -> verification succeeds, session created
     *   'expired' -> returns expiry error
     *   'used'    -> returns already-used error
     *   anything else -> returns invalid-token error
     */
    async verifyOtp({ token_hash, type: _type }: { token_hash: string; type: string }) {
      if (token_hash === 'valid') {
        // Pick the first pending user or fall back to mock user
        const pending = _pendingVerification.entries().next().value;
        if (pending) {
          const [email, { id, profile }] = pending as [string, { id: string; password: string; profile: Record<string, unknown> }];
          _pendingVerification.delete(email);
          _verifiedUsers.set(email, { id, password: '', profile });
          _session = { user: { id, email, app_metadata: {}, user_metadata: { full_name: 'PayBridge Worker' } } };
        } else {
          // No pending user - sign in as the default mock user
          _session = { user: { id: MOCK_USER_ID, email: 'worker@paybridge.com', app_metadata: {}, user_metadata: { full_name: 'PayBridge Worker' } } };
        }
        _notifyAuth('SIGNED_IN');
        return { data: { user: _session?.user }, error: null };
      }

      if (token_hash === 'expired') {
        return {
          data: null,
          error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
        };
      }

      if (token_hash === 'used') {
        return {
          data: null,
          error: { code: 'otp_disabled', message: 'Email link is invalid or has already been used' },
        };
      }

      // Any other token - invalid
      return {
        data: null,
        error: { code: 'otp_expired', message: 'Invalid verification token' },
      };
    },

    async signOut() {
      _session = null;
      _notifyAuth('SIGNED_OUT');
      return { error: null };

    },

    async resetPasswordForEmail(email: string) {
      // Simulate sending reset email - always succeeds in mock mode
      console.log(`[mock] Password reset email sent to ${email}`);
      return { error: null };
    },
  },

  storage: {
    from(_bucket: string) {
      return {
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
        createSignedUrl: async (path: string) => ({ data: { signedUrl: 'mock://kyc-documents/' + path }, error: null }),
      };
    },
  },
} as const;







