import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className = '', noPadding = false }: PageContainerProps) {
  return (
    <main
      className={`max-w-2xl mx-auto w-full ${noPadding ? '' : 'px-4 py-4'} pb-24 ${className}`}
    >
      {children}
    </main>
  );
}
