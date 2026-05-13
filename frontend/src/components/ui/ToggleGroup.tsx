'use client';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ToggleGroupProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  hint?: string;
  error?: string;
  size?: 'sm' | 'md';
}

export function ToggleGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  size = 'md',
}: ToggleGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-lg font-medium transition-all ${
                size === 'sm' ? 'text-xs py-1.5 px-2' : 'text-sm py-2 px-3'
              } ${
                isSelected
                  ? 'bg-taxi-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white'
              }`}
            >
              {option.label}
              {option.description && isSelected && (
                <span className="block text-[10px] opacity-75">{option.description}</span>
              )}
            </button>
          );
        })}
      </div>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
