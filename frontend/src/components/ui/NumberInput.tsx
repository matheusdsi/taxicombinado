'use client';

import { forwardRef } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  error?: string;
  suffix?: string;
  prefix?: string;
  step?: number;
  decimals?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, value, onChange, hint, error, suffix, prefix, required, disabled, min = 0, max, step = 0.1, decimals = 1, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div
          className={`flex items-center border rounded-xl px-3 py-2.5 bg-white transition-all focus-within:border-taxi-500 focus-within:ring-2 focus-within:ring-taxi-100 ${
            error ? 'border-red-400' : 'border-gray-200'
          } ${disabled ? 'opacity-50 bg-gray-50' : ''}`}
        >
          {prefix && <span className="text-gray-400 text-sm mr-1.5">{prefix}</span>}
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            value={value || ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(isNaN(v) ? 0 : v);
            }}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className="flex-1 outline-none bg-transparent text-gray-900 text-base w-full"
            {...rest}
          />
          {suffix && <span className="text-gray-400 text-sm ml-1.5 whitespace-nowrap">{suffix}</span>}
        </div>
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
