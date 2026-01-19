import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AlertViewport } from '@/components/ui/alert-viewport'

const queryClient = new QueryClient()

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AlertViewport />
    </QueryClientProvider>
  )
}
