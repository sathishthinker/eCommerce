import type { OrderStatus, PaymentStatus } from '@/types';

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

interface GenericBadgeProps {
  label: string;
  color?: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${orderStatusColors[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${paymentStatusColors[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
}

export function Badge({ label, color = 'bg-gray-100 text-gray-700' }: GenericBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

// Unified Badge used via <Badge type="order" value="shipped" />
interface UnifiedBadgeProps {
  type: 'order' | 'payment'
  value: string
}

export default function UnifiedBadge({ type, value }: UnifiedBadgeProps) {
  const colorMap = type === 'order' ? orderStatusColors : paymentStatusColors
  const cls = (colorMap as Record<string, string>)[value] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {value}
    </span>
  )
}
