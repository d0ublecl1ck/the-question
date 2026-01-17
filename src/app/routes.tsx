/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation, type RouteObject } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ChatPage from '../pages/ChatPage'
import HomePage from '../pages/HomePage'
import LibraryPage from '../pages/LibraryPage'
import LoginPage from '../pages/LoginPage'
import MarketPage from '../pages/MarketPage'
import AboutPage from '../pages/AboutPage'
import NotFoundPage from '../pages/NotFoundPage'
import PricePage from '../pages/PricePage'
import SearchPage from '../pages/SearchPage'
import SettingsPage from '../pages/SettingsPage'
import SkillDetailPage from '../pages/SkillDetailPage'
import { useAppSelector } from '@/store/hooks'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const status = useAppSelector((state) => state.auth.status)
  const location = useLocation()
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AppShell />
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'price', element: <PricePage /> },
      { path: 'login', element: <LoginPage /> },
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: 'chat', element: <ChatPage /> },
          { path: 'chat/:sessionId', element: <ChatPage /> },
          { path: 'market', element: <MarketPage /> },
          { path: 'skills/:id', element: <SkillDetailPage /> },
          { path: 'library', element: <LibraryPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'search', element: <SearchPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
