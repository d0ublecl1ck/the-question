import { create } from 'zustand'

type ToastItem = {
  id: string
  message: string
}

type ToastState = {
  toasts: ToastItem[]
  push: (message: string, durationMs?: number) => void
  remove: (id: string) => void
}

const DEFAULT_DURATION = 3000

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, durationMs = DEFAULT_DURATION) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    window.setTimeout(() => {
      get().remove(id)
    }, durationMs)
  },
  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))
