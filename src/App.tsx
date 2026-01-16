import { RouterProvider } from 'react-router-dom'
import { createAppRouter } from './app/router'
import { AppProviders } from './app/providers'
import './App.css'

const router = createAppRouter()

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
