'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import { api } from '@/lib/api'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page }
      if (search) params.search = search
      const res = await api.admin.getUsers(params)
      setUsers(res.items || [])
      setTotal(res.total || 0)
      setPages(res.pages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex gap-1">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white w-64"
          />
          <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
        <span className="text-sm text-gray-500">{total} users</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map(user => {
                  const initials = user.name
                    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : user.email[0].toUpperCase()
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-600">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.name || '—'}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {user.is_admin ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">Admin</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-600">Customer</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {user.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
