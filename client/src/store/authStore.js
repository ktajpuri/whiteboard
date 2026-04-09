import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(persist(
  (set) => ({
    user: null,
    isGuest: true,
    setUser: (user) => set({ user, isGuest: false }),
    logout: () => set({ user: null, isGuest: true })
  }),
  { name: 'wb-auth', partialize: (s) => ({ user: s.user, isGuest: s.isGuest }) }
))
