'use client';

import { ReactNode } from 'react';

interface LoadingButtonProps {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  icon?: ReactNode;
}

const variantClasses = {
  primary: 'bg-taxi-500 hover:bg-taxi-600 text-white shadow-sm active:scale-[0.98]',
  secondary: 'bg-white border-2 border-taxi-500 text-taxi-600 hover:bg-taxi-50 active:scale-[0.98]',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98]',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-[0.98]',
};

const sizeClasses = {
  sm: 'text-sm py-2 px-4 rounded-xl',
  md: 'text-base py-3 px-6 rounded-xl',
  lg: 'text-lg py-4 px-8 rounded-2xl font-semibold',
};

export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon,
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium transition-all
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Calculando...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
