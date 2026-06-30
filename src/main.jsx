/* ── main.jsx ──
   Vite entry point. RendeRs the React app into #root
   and imports global Tailwind styles. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
