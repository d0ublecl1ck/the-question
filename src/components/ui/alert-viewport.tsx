import type { ComponentType } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAppSelector } from '@/store/hooks'
import type { AlertVariant } from '@/store/slices/alertSlice'
import { AlertTriangle, Info } from 'lucide-react'

const icons: Record<AlertVariant, ComponentType<{ className?: string }>> = {
  secondary: Info,
  destructive: AlertTriangle,
}

export function AlertViewport() {
  const alerts = useAppSelector((state) => state.alert.alerts)
  if (alerts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-[340px] max-w-[calc(100vw-3rem)] flex-col gap-2.5">
      {alerts.map((alert) => {
        const Icon = icons[alert.variant] ?? Info
        return (
          <Alert
            key={alert.id}
            role="alert"
            variant={alert.variant}
            className="pointer-events-auto shadow-sm motion-safe:animate-in motion-safe:slide-in-from-top-1 motion-safe:fade-in hover:shadow-md"
          >
            <Icon className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
