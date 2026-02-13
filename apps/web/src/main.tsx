import { logger } from '@/lib/logger'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './index.css'

if (logger) {
  window.addEventListener('error', (event) => {
    logger?.error('Uncaught error', {
      message: event.error?.message,
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger?.error('Unhandled promise rejection', {
      reason: String(event.reason),
    })
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
