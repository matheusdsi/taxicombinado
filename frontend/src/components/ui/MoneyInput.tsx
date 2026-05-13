'use client';

import { forwardRef, useState, useCallback, useEffect } from 'react';

interface MoneyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ label, value, onChange, placeholder = '0,00', hint, error, required, disabled, min = 0 }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => {
      if (value === 0) return '';
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
    const [focused, setFocused] = useState(false);

    // Sync display when value changes externally (e.g. preset switch)
    useEffect(() => {
      if (!focused) {
        setDisplayValue(
          value > 0
            ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : ''
        );
      }
    }, [value, focused]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setDisplayValue(raw);

        // Parse the value
        let cleaned = raw.replace(/[^\d,]/g, '');
        cleaned = cleaned.replace(',', '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          onChange(parsed);
        } else if (cleaned === '' || cleaned === '.') {
          onChange(0);
        }
      },
      [onChange]
    );

    const handleBlur = useCallback(() => {
      setFocused(false);
      if (value > 0) {
        setDisplayValue(
          value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleFocus = useCallback(() => {
      setFocused(true);
      if (value > 0) {
        setDisplayValue(
          value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
      }
    }, [value]);

    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div
          className={`flex items-center border rounded-xl px-3 py-2.5 bg-white transition-all ${
            focused
              ? 'border-taxi-500 ring-2 ring-taxi-100'
              : error
              ? 'border-red-400'
              : 'border-gray-200'
          } ${disabled ? 'opacity-50 bg-gray-50' : ''}`}
          style={{ minWidth: 0 }}
        >
          <span className="text-gray-400 text-sm mr-1.5 font-medium shrink-0">R$</span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            className="flex-1 outline-none bg-transparent text-gray-900 text-base placeholder-gray-300 min-w-0"
            style={{ width: 0 }}
          />
        </div>
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
