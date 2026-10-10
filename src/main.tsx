import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { InstallButton } from './components/InstallButton'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <InstallButton />
  </StrictMode>,
)
