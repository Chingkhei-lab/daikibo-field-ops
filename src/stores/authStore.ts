import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'field_officer' | 'admin' | 'distributor';
    token: string;
    organization?: string;
    website?: string;
    manager_name?: string;
    territory?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
    token: string | null;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,
            login: (user) => set({ user, isAuthenticated: true, token: user.token }),
            logout: () => set({ user: null, isAuthenticated: false, token: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, token: state.token }),
        }
    )
);
