import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { profile, isLoading, isAuthenticated, setProfile, setLoading, setAuthenticated } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setAuthenticated(false);
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (session?.user) {
        setAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

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
    if (error) throw error;
    navigate('/dashboard');
  }

  async function signUp(email: string, password: string, fullName: string, phone: string, country: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, country },
      },
    });
    if (error) throw error;
    navigate('/verify-email');
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return { profile, isLoading, isAuthenticated, signIn, signUp, signOut };
}
