'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { wishlist as wishlistApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { WishlistItem } from '@/types';

interface WishlistContextValue {
  items: WishlistItem[];
  productIds: Set<number>;
  loading: boolean;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const productIds = new Set(items.map((item) => item.product_id));

  const isInWishlist = (productId: number): boolean => {
    return productIds.has(productId);
  };

  const toggleWishlist = async (productId: number) => {
    if (isInWishlist(productId)) {
      const data = await wishlistApi.removeFromWishlist(productId);
      setItems(data.items || []);
    } else {
      const data = await wishlistApi.addToWishlist(productId);
      setItems(data.items || []);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        productIds,
        loading,
        isInWishlist,
        toggleWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}
