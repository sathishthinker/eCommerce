'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth as authApi, addresses as addressesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { Address } from '@/types';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

type Tab = 'profile' | 'addresses' | 'password';

// ─── Profile Tab ───────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await authApi.updateMe(form);
      updateUser(data.user);
      success('Profile updated!');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Full Name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Email Address
        </label>
        <input
          value={user?.email || ''}
          disabled
          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Phone Number
        </label>
        <div className="flex">
          <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm font-medium text-gray-600">
            +91
          </div>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            maxLength={10}
            className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Address Card ──────────────────────────────────────────────────────────
function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: (a: Address) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm text-primary">{address.name}</p>
            {address.is_default && (
              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded font-semibold">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {address.address_line1}
            {address.address_line2 && `, ${address.address_line2}`}
          </p>
          <p className="text-sm text-gray-600">
            {address.city}, {address.state} — {address.pincode}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">+91 {address.phone}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(address)}
            className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(address.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Address Form ──────────────────────────────────────────────────────────
function AddressFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Address>;
  onSave: (data: Omit<Address, 'id' | 'user_id'>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    address_line1: initial?.address_line1 || '',
    address_line2: initial?.address_line2 || '',
    city: initial?.city || '',
    state: initial?.state || '',
    pincode: initial?.pincode || '',
    is_default: initial?.is_default || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-black text-primary uppercase tracking-wider">
            {initial?.id ? 'Edit Address' : 'New Address'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                type="tel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Address Line 1 *</label>
            <input
              value={form.address_line1}
              onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
              required
              placeholder="House/Flat No, Street"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Address Line 2</label>
            <input
              value={form.address_line2}
              onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
              placeholder="Landmark (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">City *</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Select</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Pincode *</label>
              <input
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:border-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Addresses Tab ─────────────────────────────────────────────────────────
function AddressesTab() {
  const { success, error } = useToast();
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    addressesApi.getAddresses()
      .then((d) => setAddressList(d.addresses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveNew = async (data: Omit<Address, 'id' | 'user_id'>) => {
    const res = await addressesApi.createAddress(data);
    setAddressList((prev) => [...prev, res.address]);
    success('Address added!');
  };

  const handleSaveEdit = async (data: Omit<Address, 'id' | 'user_id'>) => {
    if (!editingAddress) return;
    const res = await addressesApi.updateAddress(editingAddress.id, data);
    setAddressList((prev) => prev.map((a) => (a.id === editingAddress.id ? res.address : a)));
    setEditingAddress(null);
    success('Address updated!');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressesApi.deleteAddress(id);
      setAddressList((prev) => prev.filter((a) => a.id !== id));
      success('Address deleted');
    } catch {
      error('Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 max-w-lg">
        {addressList.length === 0 && (
          <p className="text-gray-400 text-sm py-4">No saved addresses yet.</p>
        )}
        {addressList.map((addr) => (
          <AddressCard
            key={addr.id}
            address={addr}
            onEdit={(a) => setEditingAddress(a)}
            onDelete={handleDelete}
          />
        ))}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-accent hover:text-amber-600 font-semibold transition-colors mt-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Address
        </button>
      </div>

      {showForm && (
        <AddressFormModal onSave={handleSaveNew} onClose={() => setShowForm(false)} />
      )}
      {editingAddress && (
        <AddressFormModal
          initial={editingAddress}
          onSave={handleSaveEdit}
          onClose={() => setEditingAddress(null)}
        />
      )}
    </>
  );
}

// ─── Password Tab ──────────────────────────────────────────────────────────
function PasswordTab() {
  const { success, error } = useToast();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      error('New passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      success('Password changed successfully!');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const EyeButton = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={form.current_password}
            onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary pr-12"
          />
          <EyeButton show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={form.new_password}
            onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
            required
            minLength={8}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary pr-12"
          />
          <EyeButton show={showNew} toggle={() => setShowNew(!showNew)} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
            required
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none pr-12 ${
              form.confirm_password && form.confirm_password !== form.new_password
                ? 'border-red-300'
                : 'border-gray-200 focus:border-primary'
            }`}
          />
        </div>
        {form.confirm_password && form.confirm_password !== form.new_password && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}

// ─── Account Page ──────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-8 skeleton rounded w-40 mb-8" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'addresses',
      label: 'Addresses',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: 'password',
      label: 'Password',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
          <span className="text-2xl font-black text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <aside className="w-48 flex-shrink-0 hidden sm:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="sm:hidden w-full">
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="hidden sm:block mb-6">
            <h2 className="text-xl font-black text-primary uppercase tracking-wider">
              {tabs.find((t) => t.key === activeTab)?.label}
            </h2>
          </div>
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}
