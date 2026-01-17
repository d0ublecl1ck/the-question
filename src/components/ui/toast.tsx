import { useToastStore } from '@/stores/toastStore'

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border border-border/60 bg-white/90 px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur"
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
