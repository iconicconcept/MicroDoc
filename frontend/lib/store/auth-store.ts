import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/medical';
import { authApi } from '@/lib/api/services';


interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          if (res?.token && res?.user) {
            localStorage.setItem("token", res.token);
            set({
              user: res.user,
              token: res.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error("Invalid login response");
          }
        } catch (err) {
          set({ isLoading: false });
          console.error("Login error:", err);
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          if (res?.token && res?.user) {
            localStorage.setItem("token", res.token);
            set({
              user: res.user,
              token: res.token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error("Invalid register response");
          }
        } catch (err) {
          set({ isLoading: false });
          console.error("Register error:", err);
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
        // localStorage.removeItem('user');
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const res = await authApi.getMe();
          if (res?.user) {
            set({
              user: res.user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            get().logout();
          }
        } catch (err) {
          console.error("checkAuth error:", err);
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      // partialize: (state) => ({ 
      //   user: state.user, 
      //   token: state.token,
      //   isAuthenticated: state.isAuthenticated 
      // }),
    }
  )
);

//useAuthStore.subscribe((state) => console.log("Auth Store:", state));