import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/lib/toast-context'
import { Toast } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Threadco Admin',
  description: 'Threadco Admin Panel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toast />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
