import { createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'

export function createAppRouter() {
  return createBrowserRouter(routes)
}
