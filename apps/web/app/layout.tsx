import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { ToastProvider } from '@/lib/toast-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Threadco — Premium Men\'s T-Shirts',
    template: '%s | Threadco',
  },
  description:
    'Shop premium men\'s t-shirts crafted for the modern man. 100% cotton, free delivery above ₹500. Wear less. Say more.',
  keywords: ['men t-shirts', 'premium cotton', 'threadco', 'men fashion india'],
  openGraph: {
    title: 'Threadco — Premium Men\'s T-Shirts',
    description: 'Premium men\'s t-shirts crafted for the modern man.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Threadco',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-white text-primary min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
