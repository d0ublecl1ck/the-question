import type { ReactNode } from 'react'
import { Navigate, useLocation, type RouteObject } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ChatPage from '../pages/ChatPage'
import HomePage from '../pages/HomePage'
import LibraryPage from '../pages/LibraryPage'
import LoginPage from '../pages/LoginPage'
import MarketPage from '../pages/MarketPage'
import NotFoundPage from '../pages/NotFoundPage'
import SearchPage from '../pages/SearchPage'
import SettingsPage from '../pages/SettingsPage'
import SkillDetailPage from '../pages/SkillDetailPage'
import { useAuthStore } from '../stores/authStore'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/market', element: <MarketPage /> },
      { path: '/skills/:id', element: <SkillDetailPage /> },
      { path: '/library', element: <LibraryPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/search', element: <SearchPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
