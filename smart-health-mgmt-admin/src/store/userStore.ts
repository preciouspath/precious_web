// // src/store/userStore.ts
// import { create } from "zustand";

// interface UserStore {
//   user: any | null;
//   token: string | null;
//   setUser: (user: any, token: string) => void;
//   logout: () => void;
//   isAuthenticated: boolean;
// }

// export const useUserStore = create<UserStore>((set) => ({
//   user: null,
//   token: null,
//   isAuthenticated: false,
//   setUser: (user, token) =>
//     set({
//       user,
//       token,
//       isAuthenticated: true,
//     }),
//   logout: () =>
//     set({
//       user: null,
//       token: null,
//       isAuthenticated: false,
//     }),
// }));


import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserStore {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: any, token: string) => void;
  setProfileImage: (imageUrl: string) => void;
  logout: () => void;
}

export const useUserStore = create(
  persist<UserStore>(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      setProfileImage: (imageUrl: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, profileImage: imageUrl } : null,
        })),

      logout: async () => {
        try {
          // Call backend logout to clear cookie
          const { logout: logoutApi } = await import('../api/authApi');
          await logoutApi();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Always clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-store",
    }
  )
);
