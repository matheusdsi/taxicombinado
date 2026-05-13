'use client';

import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ label, value, onChange, options, hint, error, required, disabled }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div
          className={`relative border rounded-xl bg-white transition-all focus-within:border-taxi-500 focus-within:ring-2 focus-within:ring-taxi-100 ${
            error ? 'border-red-400' : 'border-gray-200'
          } ${disabled ? 'opacity-50 bg-gray-50' : ''}`}
        >
          <select
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 bg-transparent outline-none text-gray-900 text-base appearance-none pr-8 cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

SelectInput.displayName = 'SelectInput';
