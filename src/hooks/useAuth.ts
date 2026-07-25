import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

    if (data && !error) {
      setProfile(data as any);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (isUnconfirmedError(error)) {
        // Store the email so login page can offer resend
        setPendingEmail(email);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, country },
      },
    });
    if (error) throw error;
    // Store the email so the verify-email page can display and resend to it
    setPendingEmail(email);
    setEmailUnverified(true);
    navigate('/verify-email', { state: { email } });
  }

  async function resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
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
