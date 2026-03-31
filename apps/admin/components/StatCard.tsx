const COLOR_MAP: Record<string, string> = {
  amber: 'bg-amber-400 text-gray-900',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  purple: 'bg-purple-500 text-white',
  red: 'bg-red-500 text-white',
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  color = 'amber',
}: StatCardProps) {
  const colorClass = COLOR_MAP[color] || color
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`${colorClass} p-3 rounded-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
        {change !== undefined && (
          <p
            className={`text-xs mt-1 font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}% from last period
          </p>
        )}
      </div>
    </div>
  );
}
