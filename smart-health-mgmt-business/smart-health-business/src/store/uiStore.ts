import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    isMobileMenuOpen: boolean;
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
}

const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    isMobileMenuOpen: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
}));

export default useUIStore;
