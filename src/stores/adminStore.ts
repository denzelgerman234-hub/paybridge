import { create } from 'zustand';
import { ADMIN_USER } from '../lib/adminMockData';

interface AdminState {
  isAdminAuth: boolean;
  adminUser: typeof ADMIN_USER | null;
  adminLogin: (email: string, password: string) => boolean;
  adminLogout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdminAuth: false,
  adminUser: null,

  adminLogin: (email, password) => {
    // In local mode: hardcoded admin creds
    // In production: use Supabase roles / separate admin auth
    if (
      (email === 'admin@paybridge.work' || email === 'admin') &&
      (password === 'admin123' || password === 'admin')
    ) {
      set({ isAdminAuth: true, adminUser: ADMIN_USER });
      return true;
    }
    return false;
  },

  adminLogout: () => set({ isAdminAuth: false, adminUser: null }),
}));
