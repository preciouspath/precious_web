import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface User {
    _id: string;
    fullName: string;
    email: string;
    mobileNumber?: string;
    role: string;
    profileImage?: string;
    countryCode?: string;
    dateOfBirth?: string;
    gender?: string;
    qrCode?: string;
    qrUrl?: string;
    healthProfile?: {
        height?: number;
        weight?: number;
        bloodPressure?: string;
        bloodGroup?: string;
        diabetes?: string;
        healthConditions?: string;
        emergencyContact?: {
            name?: string;
            phone?: string;
            countryCode?: string;
            countryName?: string;
            relation?: string;
        };
        smartwatch?: {
            connected?: boolean;
            type?: string;
            lastSync?: string;
            data?: {
                heartRate?: string;
                steps?: string;
                sleep?: string;
                bloodOxygen?: string;
                bloodPressure?: string;
            };
        };
        fitbit?: {
            userId?: string;
            scope?: string;
            lastSync?: string;
            tokenExpiresAt?: string;
        };
    };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    unreadCount: number;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    login: (user: User) => void;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
    initialize: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
    setUnreadCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    unreadCount: 0,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setLoading: (loading) => set({ isLoading: loading }),

    login: (user) => set({ user, isAuthenticated: true, isInitialized: true }),

    logout: async () => {
        try {
            await axiosClient.post('/logout');
        } catch (e) {
            // Continue logout even if API fails
        }
        set({ user: null, isAuthenticated: false });
    },

    fetchMe: async () => {
        try {
            set({ isLoading: true });
            const response = await axiosClient.get('/me');
            if (response.data?.success && response.data?.data) {
                set({ user: response.data.data, isAuthenticated: true });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch (error) {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    initialize: async () => {
        if (get().isInitialized) return;

        // If user is already set (e.g., from login response), skip API call
        if (get().user) {
            set({ isInitialized: true });
            return;
        }

        try {
            set({ isLoading: true });
            const response = await axiosClient.get('/me');
            if (response.data?.success && response.data?.data) {
                set({ user: response.data.data, isAuthenticated: true });
            }
        } catch (error) {
            // Not authenticated - this is fine (user needs to login)
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false, isInitialized: true });
        }
    },

    refreshUnreadCount: async () => {
        try {
            const { getUnreadCount } = await import('../api/notificationApi');
            const response = await getUnreadCount();
            if (response.data?.success) {
                set({ unreadCount: response.data.data?.unreadCount || 0 });
            }
        } catch (error) {
            console.error("Error refreshing unread count:", error);
        }
    },

    setUnreadCount: (count) => set({ unreadCount: count }),
}));

export default useAuthStore;
