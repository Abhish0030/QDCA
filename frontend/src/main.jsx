import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import { initPerformanceMonitoring } from './lib/monitoring.js'

initPerformanceMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <ToastViewport />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
