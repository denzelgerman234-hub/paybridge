import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type AdminUser = {
  id: string;
  email: string;
  name: string;
};

interface AdminState {
  isAdminLoading: boolean;
  isAdminAuth: boolean;
  adminUser: AdminUser | null;
  initAdminSession: () => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => Promise<void>;
}

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

function isAdminUser(user: SupabaseUser | null | undefined) {
  const metadata = user?.app_metadata ?? {};
  return metadata.role === 'admin' || metadata.admin === true;
}

function toAdminUser(user: SupabaseUser): AdminUser {
  return {
    id: user.id,
    email: user.email ?? 'admin',
    name: typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : 'PayBridge Admin',
  };
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdminLoading: true,
  isAdminAuth: false,
  adminUser: null,

  initAdminSession: async () => {
    set({ isAdminLoading: true });
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user as SupabaseUser | undefined;

      if (isAdminUser(user)) {
        set({ isAdminAuth: true, adminUser: toAdminUser(user!), isAdminLoading: false });
        return;
      }
    } catch (err) {
      console.error('[paybridge] Failed to initialize admin session', err);
    }

    set({ isAdminAuth: false, adminUser: null, isAdminLoading: false });
  },

  adminLogin: async (email, password) => {
    set({ isAdminLoading: true });

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      set({ isAdminAuth: false, adminUser: null, isAdminLoading: false });
      throw error;
    }

    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user as SupabaseUser | undefined;

    if (!isAdminUser(user)) {
      await supabase.auth.signOut();
      set({ isAdminAuth: false, adminUser: null, isAdminLoading: false });
      throw new Error('Admin access required');
    }

    set({ isAdminAuth: true, adminUser: toAdminUser(user!), isAdminLoading: false });
  },

  adminLogout: async () => {
    await supabase.auth.signOut();
    set({ isAdminAuth: false, adminUser: null, isAdminLoading: false });
  },
}));
