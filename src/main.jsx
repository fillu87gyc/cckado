import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@freee_jp/vibes/css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
