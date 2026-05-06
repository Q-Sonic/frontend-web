import type { ReactNode } from 'react';

type ClientAreaPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function ClientAreaPageShell({ children, className = '' }: ClientAreaPageShellProps) {
  return (
    <div className={`relative min-h-full bg-surface text-neutral-100 ${className}`.trim()}>
      <div className="p-4 md:p-6 pb-28">{children}</div>
    </div>
  );
}
