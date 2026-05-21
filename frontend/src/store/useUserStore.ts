import { create } from 'zustand';

export interface IUserProfile {
  name: string;
  email: string;
  schoolName: string;
  schoolBranch: string;
  role: string;
  avatarUrl?: string;
}

interface UserState {
  user: IUserProfile | null;
  loading: boolean;
  error: string | null;
  
  fetchProfile: () => Promise<IUserProfile | null>;
  updateProfile: (data: Partial<IUserProfile>) => Promise<boolean>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      set({ user: data });
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      set({ error: (err as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      set({ user: updatedUser });
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  }
}));
