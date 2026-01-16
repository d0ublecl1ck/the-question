import type { RouteObject } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ChatPage from '../pages/ChatPage'
import LibraryPage from '../pages/LibraryPage'
import LoginPage from '../pages/LoginPage'
import MarketPage from '../pages/MarketPage'
import NotFoundPage from '../pages/NotFoundPage'
import SearchPage from '../pages/SearchPage'
import SettingsPage from '../pages/SettingsPage'
import SkillDetailPage from '../pages/SkillDetailPage'

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <ChatPage /> },
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
