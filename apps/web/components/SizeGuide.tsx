'use client';

import React from 'react';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const sizeData = [
  { size: 'S', chest: '36-38"', length: '27"', shoulder: '16.5"' },
  { size: 'M', chest: '38-40"', length: '28"', shoulder: '17.5"' },
  { size: 'L', chest: '40-42"', length: '29"', shoulder: '18.5"' },
  { size: 'XL', chest: '42-44"', length: '30"', shoulder: '19.5"' },
  { size: 'XXL', chest: '44-46"', length: '31"', shoulder: '20.5"' },
];

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
            Size Guide
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            All measurements are in inches. For the best fit, measure your chest at its widest point.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-bold text-primary uppercase tracking-wider text-xs">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-primary uppercase tracking-wider text-xs">
                    Chest
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-primary uppercase tracking-wider text-xs">
                    Length
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-primary uppercase tracking-wider text-xs">
                    Shoulder
                  </th>
                </tr>
              </thead>
              <tbody>
                {sizeData.map((row, i) => (
                  <tr
                    key={row.size}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 font-bold text-primary">{row.size}</td>
                    <td className="px-4 py-3 text-gray-600">{row.chest}</td>
                    <td className="px-4 py-3 text-gray-600">{row.length}</td>
                    <td className="px-4 py-3 text-gray-600">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-800 font-medium">
              How to measure:
            </p>
            <ul className="mt-2 space-y-1">
              <li className="text-xs text-amber-700">
                <strong>Chest:</strong> Measure around the fullest part of your chest with arms relaxed at sides.
              </li>
              <li className="text-xs text-amber-700">
                <strong>Length:</strong> Measure from the highest point of the shoulder to the hem.
              </li>
              <li className="text-xs text-amber-700">
                <strong>Shoulder:</strong> Measure from one shoulder seam to the other across the back.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
