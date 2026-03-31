'use client'

import { useAuth } from '@/lib/auth-context'

interface AdminHeaderProps {
  title: string
  onMenuClick: () => void
}

export default function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: user */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900">{initials}</span>
        </div>
      </div>
    </header>
  )
}
