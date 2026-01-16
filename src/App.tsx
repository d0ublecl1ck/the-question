import { RouterProvider } from 'react-router-dom'
import { createAppRouter } from './app/router'
import './App.css'

const router = createAppRouter()

function App() {
  return <RouterProvider router={router} />
}

export default App
