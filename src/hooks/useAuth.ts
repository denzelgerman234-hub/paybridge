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
    setProfile,
    setLoading,
    setAuthenticated,
    setEmailUnverified,
    setPendingEmail,
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (session?.user) {
          // Supabase only creates a real session after email confirmation.
          // In mock mode we also guard via signInWithPassword.
          setAuthenticated(true);
          setEmailUnverified(false);
          fetchProfile(session.user.id);
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
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[paybridge] Failed to fetch worker profile', error);
    }

    if (data && !error) {
      setProfile(data as any);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      console.error('[paybridge] Supabase signInWithPassword failed', error);
      if (isUnconfirmedError(error)) {
        // Store the email so login page can offer resend
        setPendingEmail(normalizedEmail);
        setEmailUnverified(true);
        throw new EmailNotConfirmedError();
      }
      throw error;
    }
    navigate('/dashboard');
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    country: string,
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

    // Store the email so the verify-email page can display and resend to it.
    setPendingEmail(normalizedEmail);
    setEmailUnverified(true);
    if (typeof window !== 'undefined') localStorage.setItem('pb_pending_email', normalizedEmail);
    navigate('/verify-email', { state: { email: normalizedEmail } });
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
    isLoading,
    isAuthenticated,
    isEmailUnverified,
    pendingEmail,
    signIn,
    signUp,
    signOut,
    resendVerification,
  };
}
