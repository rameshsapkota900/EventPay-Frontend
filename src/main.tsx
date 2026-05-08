import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import { Toaster } from 'sonner'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "rounded-xl border-border/80 shadow-soft-lg font-sans",
                title: "font-semibold",
                description: "text-muted-foreground",
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
