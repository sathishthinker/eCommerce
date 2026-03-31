'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import Modal from '@/components/Modal'

interface CategoryForm {
  name: string
  description: string
  image_url: string
  sort_order: string
}

const emptyForm: CategoryForm = { name: '', description: '', image_url: '', sort_order: '0' }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function CategoriesPage() {
  const { addToast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.admin.getCategories().then(setCategories).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(cat: any) {
    setEditTarget(cat)
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      sort_order: String(cat.sort_order ?? 0),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        image_url: form.image_url,
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (editTarget) {
        const updated = await api.admin.updateCategory(editTarget.id, payload)
        setCategories(prev => prev.map(c => c.id === editTarget.id ? { ...c, ...updated } : c))
        addToast('Category updated!', 'success')
      } else {
        const created = await api.admin.createCategory(payload)
        setCategories(prev => [...prev, created])
        addToast('Category created!', 'success')
      }
      setModalOpen(false)
    } catch (err: any) {
      addToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(cat: any) {
    try {
      await api.admin.updateCategory(cat.id, { is_active: !cat.is_active })
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      addToast(`Category ${!cat.is_active ? 'activated' : 'deactivated'}`, 'success')
    } catch {
      addToast('Failed to update', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{categories.length} categories</span>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sort</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No categories yet</td></tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-600">{cat.sort_order ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(cat)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          cat.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Graphic Tees"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
            {form.name && !editTarget && (
              <p className="text-xs text-gray-400 mt-1">Slug: {slugify(form.name)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
              placeholder="https://res.cloudinary.com/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
              min={0}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {saving ? 'Saving...' : (editTarget ? 'Save Changes' : 'Create Category')}
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
