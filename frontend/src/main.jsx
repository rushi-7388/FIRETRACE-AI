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
    const contentType = response.headers?.['content-type'] || ''
    if (
      contentType.includes('text/html') ||
      (typeof response.data === 'string' && response.data.trim().startsWith('<'))
    ) {
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
