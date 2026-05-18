'use client';

import { usePathname } from 'next/navigation';

export function ConditionalShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  return (
    <>
      <div className={isAdmin ? '' : 'min-h-[calc(100vh-56px)]'}>
        {children}
      </div>
      {!isAdmin && footer}
    </>
  );
}
