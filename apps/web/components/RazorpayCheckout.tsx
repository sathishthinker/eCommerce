'use client';

import { useEffect, useCallback } from 'react';
import { orders as ordersApi } from '@/lib/api';
import type { RazorpayOptions, RazorpayResponse } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

interface RazorpayCheckoutProps {
  orderId: number;
  razorpayOrderId: string;
  amount: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
}

export default function RazorpayCheckout({
  orderId,
  razorpayOrderId,
  amount,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) {
  const loadRazorpay = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      onFailure('Failed to load payment gateway. Please try again.');
      return;
    }

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: amount,
      currency: 'INR',
      name: 'Threadco',
      description: `Order #${orderId}`,
      order_id: razorpayOrderId,
      handler: async (response: RazorpayResponse) => {
        try {
          await ordersApi.verifyPayment({
            order_id: orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess(response.razorpay_payment_id);
        } catch (err) {
          onFailure(err instanceof Error ? err.message : 'Payment verification failed');
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
        contact: userPhone,
      },
      theme: {
        color: '#f59e0b',
      },
      modal: {
        ondismiss: () => {
          onFailure('Payment was cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [loadRazorpay, amount, orderId, razorpayOrderId, userName, userEmail, userPhone, onSuccess, onFailure]);

  useEffect(() => {
    openCheckout();
  }, [openCheckout]);

  return null;
}
