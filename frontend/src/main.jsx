import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'

// ── Register Service Worker (PWA) ─────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('✅ SW registered'))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#3d1a00',
            color: '#f5c842',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 20px',
          },
          success: { iconTheme: { primary: '#f5c842', secondary: '#3d1a00' } },
          error: {
            style: { background: '#5c1a1a', color: '#ffb3b3' },
            iconTheme: { primary: '#ff6b6b', secondary: '#5c1a1a' },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>
)