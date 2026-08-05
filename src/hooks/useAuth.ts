import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseConfig } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

/** Error thrown when the user's email has not yet been confirmed. */
export class EmailNotConfirmedError extends Error {
  readonly code = 'email_not_confirmed';
  constructor() {
    super('Please verify your email address before signing in.');
    this.name = 'EmailNotConfirmedError';
  }
}

function isUnconfirmedError(err: any): boolean {
  return (
    err?.code === 'email_not_confirmed' ||
    (typeof err?.message === 'string' &&
      err.message.toLowerCase().includes('email not confirmed'))
  );
}

function authRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth/callback`;
}



export function useAuth() {
  const {
    profile,
    isLoading,
    isAuthenticated,
    isEmailUnverified,
    pendingEmail,
    applicationStatus,
    setProfile,
    setLoading,
    setAuthenticated,
    setEmailUnverified,
    setPendingEmail,
    setApplicationStatus,
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Do NOT mark as authenticated — send user to the reset form instead.
          // The session is available so updateUser() will work once they submit.
          navigate('/reset-password', { replace: true });
          return;
        }
        if (session?.user) {
          // Supabase only creates a real session after email confirmation.
          // In mock mode we also guard via signInWithPassword.
          setAuthenticated(true);
          setEmailUnverified(false);
          fetchProfile(session.user.id, session.user.email);
        } else {
          setAuthenticated(false);
          setProfile(null);
          setLoading(false);
        }
      },
    );

    supabase.auth.getSession().then(
      ({ data: { session } }: { data: { session: any } }) => {
        if (session?.user) {
          setAuthenticated(true);
          fetchProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, _email?: string | null) {
    const [profileRes, appRes] = await Promise.all([
      supabase.from('worker_profiles').select('*').eq('id', userId).single(),
      supabase.from('worker_applications').select('status').eq('worker_id', userId).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
    ]);

    if (profileRes.error) {
      console.error('[paybridge] Failed to fetch worker profile', profileRes.error);
    }

    if (profileRes.data && !profileRes.error) {
      setProfile(profileRes.data as any);
      setApplicationStatus(appRes.data?.status ?? null);
    } else {
      setApplicationStatus(null);
    }
    setLoading(false);
  }

  async function navigateAfterLogin() {
    const { data: appRow } = await supabase
      .from('worker_applications')
      .select('status')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const appStatus = (appRow as any)?.status;
    navigate(appStatus && appStatus !== 'approved' ? '/application-status' : '/dashboard');
  }

  async function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      console.error('[paybridge] Supabase signInWithPassword failed', error);
      if (isUnconfirmedError(error)) {
        setPendingEmail(normalizedEmail);
        setEmailUnverified(true);
        throw new EmailNotConfirmedError();
      }
      throw error;
    }
    
    // Check MFA
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel === 'aal1') {
      return { needsTwoFactor: true };
    }

    await navigateAfterLogin();
    return { needsTwoFactor: false };
  }

  async function verifyTwoFactorLogin(code: string) {
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const factor = factors.all?.find((f: { id: string; status: string }) => f.status === 'verified');
    if (!factor) throw new Error('No verified 2FA factor found');
    
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) throw challengeError;
    
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challengeData.id,
      code
    });
    if (verifyError) throw verifyError;
    
    await navigateAfterLogin();
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    country: string,
    applicationData?: {
      city: string;
      occupation: string;
      why: string;
      bank: string;
      methods: string[];
      notes?: string;
    },
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = authRedirectUrl();

    console.info('[paybridge] Starting Supabase signup', {
      email: normalizedEmail,
      redirectTo,
      supabaseHost: supabaseConfig.urlHost,
      mode: supabaseConfig.mode,
      isUsingMock: supabaseConfig.isUsingMock,
      hasSupabaseCredentials: supabaseConfig.hasSupabaseCredentials,
    });

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          country,
          // Application fields — picked up by handle_new_user() trigger
          ...(applicationData ? {
            city: applicationData.city,
            occupation: applicationData.occupation,
            why: applicationData.why,
            bank: applicationData.bank,
            methods: applicationData.methods,
            app_notes: applicationData.notes ?? null,
          } : {}),
        },
      },
    });

    if (error) {
      console.error('[paybridge] Supabase signUp failed', error);
      throw error;
    }

    console.info('[paybridge] Supabase signUp succeeded', {
      userId: data?.user?.id,
      emailConfirmedAt: data?.user?.email_confirmed_at,
      hasSession: Boolean(data?.session),
    });

    if (!data?.user && !supabaseConfig.isUsingMock) {
      throw new Error('Supabase did not return a user for this signup request. Check the browser Network tab and Supabase Auth logs.');
    }

    setPendingEmail(normalizedEmail);
    setEmailUnverified(true);
    if (typeof window !== 'undefined') localStorage.setItem('pb_pending_email', normalizedEmail);
    navigate('/verify-email', { state: { email: normalizedEmail } });
    return data?.user?.id ?? null;
  }

  async function resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) {
      console.error('[paybridge] Supabase resend verification failed', error);
      throw error;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEmailUnverified(false);
    setPendingEmail('');
    navigate('/');
  }

  return {
    profile,
    applicationStatus,
    isLoading,
    isAuthenticated,
    isEmailUnverified,
    pendingEmail,
    signIn,
    verifyTwoFactorLogin,
    signUp,
    signOut,
    resendVerification,
  };
}




