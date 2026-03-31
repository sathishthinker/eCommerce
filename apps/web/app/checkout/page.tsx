'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { addresses as addressesApi, orders as ordersApi } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import type { Address, Order } from '@/types';

const DELIVERY_THRESHOLD = 50000;
const DELIVERY_CHARGE = 9900;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

interface AddressFormData {
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AddressFormData>;
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AddressFormData>({
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
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof AddressFormData) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Full Name *
          </label>
          <input
            {...field('name')}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Phone *
          </label>
          <input
            {...field('phone')}
            required
            type="tel"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
          Address Line 1 *
        </label>
        <input
          {...field('address_line1')}
          required
          placeholder="House/Flat No, Street, Area"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
          Address Line 2
        </label>
        <input
          {...field('address_line2')}
          placeholder="Landmark (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            City *
          </label>
          <input
            {...field('city')}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            State *
          </label>
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
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Pincode *
          </label>
          <input
            {...field('pincode')}
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
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold hover:border-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { success, error } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Razorpay state
  const [razorpayData, setRazorpayData] = useState<{
    orderId: number;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);

  const deliveryCharge = subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    addressesApi.getAddresses().then((d) => {
      const addrs = d.addresses || [];
      setSavedAddresses(addrs);
      const def = addrs.find((a) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
      else setShowAddForm(true);
    }).catch(() => {
      setShowAddForm(true);
    }).finally(() => setLoadingAddresses(false));
  }, [user, router]);

  const handleAddAddress = async (formData: AddressFormData) => {
    const data = await addressesApi.createAddress(formData);
    const newAddr = data.address;
    setSavedAddresses((prev) => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowAddForm(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      error('Please select a delivery address');
      return;
    }
    if (items.length === 0) {
      error('Your cart is empty');
      return;
    }

    setPlacingOrder(true);
    try {
      const data = await ordersApi.createOrder({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: coupon || undefined,
      });

      if (paymentMethod === 'razorpay' && data.razorpay_order_id) {
        setRazorpayData({
          orderId: data.order.id,
          razorpayOrderId: data.razorpay_order_id,
          amount: data.order.total,
        });
      } else {
        // COD
        await clearCart();
        router.push(`/orders/${data.order.id}?success=true`);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-primary uppercase tracking-wider mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[{ num: 1, label: 'Address' }, { num: 2, label: 'Payment' }].map((s) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  step === s.num
                    ? 'bg-primary text-white'
                    : step > s.num
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span className={`text-sm font-bold uppercase tracking-wider ${step === s.num ? 'text-primary' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {s.num < 2 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-wider mb-5">
                Delivery Address
              </h2>

              {loadingAddresses ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
                </div>
              ) : (
                <>
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-primary bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="accent-primary mt-1 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-primary">{addr.name}</p>
                              {addr.is_default && (
                                <span className="bg-accent text-white text-xs px-2 py-0.5 rounded font-semibold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {addr.address_line1}
                              {addr.address_line2 && `, ${addr.address_line2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">+91 {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {showAddForm ? (
                    <div className="border border-gray-200 rounded-xl p-5">
                      <h3 className="font-bold text-primary mb-4">Add New Address</h3>
                      <AddressForm
                        onSave={handleAddAddress}
                        onCancel={() => {
                          if (savedAddresses.length > 0) setShowAddForm(false);
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 text-sm text-accent hover:text-amber-600 font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Address
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  if (!selectedAddressId) {
                    error('Please select or add a delivery address');
                    return;
                  }
                  setStep(2);
                }}
                className="mt-6 w-full bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                </button>
                <h2 className="text-xl font-black text-primary uppercase tracking-wider">
                  Payment
                </h2>
              </div>

              {/* Selected address summary */}
              {selectedAddressId && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Delivering to
                    </p>
                    {(() => {
                      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
                      if (!addr) return null;
                      return (
                        <>
                          <p className="font-bold text-sm text-primary">{addr.name}</p>
                          <p className="text-sm text-gray-600">
                            {addr.address_line1}, {addr.city}, {addr.state} {addr.pincode}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-accent hover:text-amber-600 font-semibold transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Coupon */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent uppercase"
                  />
                  <button className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-wider">
                    Apply
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-primary bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="accent-primary"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <div>
                        <p className="font-bold text-sm text-primary">Pay Online</p>
                        <p className="text-xs text-gray-400">UPI, Cards, Net Banking via Razorpay</p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-primary bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-primary"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="font-bold text-sm text-primary">Cash on Delivery</p>
                        <p className="text-xs text-gray-400">Pay when your order arrives</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full bg-accent text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order — ₹{Math.floor(total / 100).toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="bg-gray-50 rounded-2xl p-5 sticky top-24">
            <h2 className="font-black text-primary uppercase tracking-wider mb-4">
              Order ({items.length} items)
            </h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const img = item.variant.images?.[0]?.url || item.product.primary_image_url;
                return (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="relative w-12 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {img && (
                        <Image
                          src={img}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-gray-400">{item.variant.color} / {item.variant.size}</p>
                    </div>
                    <p className="text-xs font-bold text-primary flex-shrink-0">
                      ₹{Math.floor((item.variant.price * item.quantity) / 100).toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{Math.floor(subtotal / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                {deliveryCharge === 0 ? (
                  <span className="text-green-600 font-semibold">FREE</span>
                ) : (
                  <span className="font-semibold">₹{Math.floor(deliveryCharge / 100)}</span>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between">
                <span className="font-black text-primary uppercase tracking-wider">Total</span>
                <span className="font-black text-primary text-lg">
                  ₹{Math.floor(total / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Component */}
      {razorpayData && (
        <RazorpayCheckout
          orderId={razorpayData.orderId}
          razorpayOrderId={razorpayData.razorpayOrderId}
          amount={razorpayData.amount}
          userName={user.name}
          userEmail={user.email}
          userPhone={user.phone}
          onSuccess={async (paymentId) => {
            await clearCart();
            success('Payment successful!');
            router.push(`/orders/${razorpayData.orderId}?success=true`);
          }}
          onFailure={(err) => {
            error(err);
            setRazorpayData(null);
          }}
        />
      )}
    </div>
  );
}
