import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Dynamic API Base URL for cloud deployments (e.g. Vercel + Backend Host)
const apiBase = import.meta.env.VITE_API_BASE_URL
if (apiBase) {
  axios.defaults.baseURL = apiBase.replace(/\/+$/, '')
}

// Reject HTML payloads (e.g. Vercel SPA rewrites returning index.html for unmapped /api routes)
// so that fallback logic (autonomous climatology model) is triggered seamlessly.
axios.interceptors.response.use(
  (response) => {
    const ct = (
      (typeof response.headers?.get === 'function' ? response.headers.get('content-type') : null) ||
      response.headers?.['content-type'] ||
      response.headers?.['Content-Type'] ||
      ''
    ).toLowerCase()

    const isHtml =
      ct.includes('text/html') ||
      (typeof response.data === 'string' && response.data.trim().startsWith('<'))

    const isApiRoute =
      response.config?.url?.includes('/api/') ||
      response.config?.url?.startsWith('/api')

    if (isHtml || (isApiRoute && typeof response.data === 'string')) {
      return Promise.reject(
        new Error('API returned HTML document instead of JSON (check VITE_API_BASE_URL or backend connectivity)')
      )
    }
    return response
  },
  (error) => Promise.reject(error)
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
