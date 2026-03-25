import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'

import { BrowserRouter } from 'react-router-dom'

/** Dismiss the HTML splash screen once the React tree has painted */
function dismissSplash() {
  const splash = document.getElementById('splash-screen')
  if (!splash) return
  // Short delay so the first paint is ready
  setTimeout(() => {
    splash.classList.add('splash-hidden')
    // Remove from DOM after the CSS transition ends
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    // Fallback removal in case transitionend doesn't fire
    setTimeout(() => splash.remove(), 800)
  }, 300)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Dismiss splash after mount
dismissSplash()
