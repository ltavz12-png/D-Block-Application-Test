import { create } from 'zustand';

type Language = 'en' | 'ka';

interface AppState {
  sidebarCollapsed: boolean;
  language: Language;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (language: Language) => void;
}

export const useAppStore = create<AppState>((set) => {
  // Read persisted values from localStorage on initialization
  let initialLanguage: Language = 'en';
  let initialCollapsed = false;

  if (typeof window !== 'undefined') {
    const storedLanguage = localStorage.getItem('dblock_admin_language');
    if (storedLanguage === 'en' || storedLanguage === 'ka') {
      initialLanguage = storedLanguage;
    }
    const storedCollapsed = localStorage.getItem('dblock_admin_sidebar_collapsed');
    if (storedCollapsed === 'true') {
      initialCollapsed = true;
    }
  }

  return {
    sidebarCollapsed: initialCollapsed,
    language: initialLanguage,

    toggleSidebar: () =>
      set((state) => {
        const newCollapsed = !state.sidebarCollapsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'dblock_admin_sidebar_collapsed',
            String(newCollapsed),
          );
        }
        return { sidebarCollapsed: newCollapsed };
      }),

    setSidebarCollapsed: (collapsed: boolean) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'dblock_admin_sidebar_collapsed',
          String(collapsed),
        );
      }
      set({ sidebarCollapsed: collapsed });
    },

    setLanguage: (language: Language) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dblock_admin_language', language);
      }
      set({ language });
    },
  };
});
