import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SharedScoreView from './share/SharedScoreView.tsx'

const path = typeof window !== 'undefined' ? window.location.pathname : '/'
const isSharedRoute = path === '/r' || path === '/r/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSharedRoute ? <SharedScoreView /> : <App />}
  </StrictMode>,
)
