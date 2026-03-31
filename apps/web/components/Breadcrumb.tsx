import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <svg
                className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.href && idx < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-primary font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
