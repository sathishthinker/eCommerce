'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { cart as cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (variantId: number, quantity = 1) => {
    const data = await cartApi.addToCart(variantId, quantity);
    setItems(data.items || []);
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    const data = await cartApi.updateCartItem(itemId, quantity);
    setItems(data.items || []);
  };

  const removeItem = async (itemId: number) => {
    const data = await cartApi.removeFromCart(itemId);
    setItems(data.items || []);
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
