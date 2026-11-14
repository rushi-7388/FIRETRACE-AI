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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
