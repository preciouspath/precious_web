import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe, logout as logoutApi } from '../api/authApi';

interface User {
    _id: string;
    ownerName: string;
    businessName: string;
    email: string;
    mobile?: string;
    role: string;
    kycStatus?: string;
    kycRejectionReason?: string;
    notificationPreferences?: {
        emailAdApproval: boolean;
        emailPlatformUpdates: boolean;
        inAppCampaignStatus: boolean;
        inAppBudgetAlerts: boolean;
    };
    businessLicense?: string;
    businessAddress?: string;
    profileImage?: string;
    countryCode?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    setUser: (user: User | null, token?: string | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    fetchMe: () => Promise<void>;
    initialize: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,

            setUser: (user, token) => set((state) => ({
                user,
                token: token !== undefined ? token : state.token,
                isAuthenticated: !!user
            })),

            setLoading: (loading) => set({ isLoading: loading }),

            login: (user, token) => set({
                user,
                token,
                isAuthenticated: true,
                isInitialized: true
            }),

            logout: async () => {
                try {
                    await logoutApi();
                } catch (error) {
                    console.error("Logout API error:", error);
                }
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isInitialized: true
                });
            },

            fetchMe: async () => {
                const token = get().token;
                if (!token) {
                    set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
                    return;
                }

                set({ isLoading: true });
                try {
                    const res = await getMe();
                    if (res.data?.success && res.data?.data) {
                        const userData = res.data.data.user || res.data.data;
                        set({ user: userData, isAuthenticated: true });
                    } else {
                        set({ user: null, isAuthenticated: false, token: null });
                    }
                } catch (error) {
                    set({ user: null, isAuthenticated: false, token: null });
                } finally {
                    set({ isLoading: false, isInitialized: true });
                }
            },

            initialize: async () => {
                if (get().isInitialized) return;

                const token = get().token;

                // Optimization: If no token is present, we don't need to call getMe (solves user request)
                if (!token) {
                    set({ isLoading: false, isInitialized: true, isAuthenticated: false });
                    return;
                }

                // If we have a token but no user, fetch user data
                if (!get().user) {
                    await get().fetchMe();
                } else {
                    set({ isInitialized: true });
                }
            },
        }),
        {
            name: 'business-auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

export default useAuthStore;
