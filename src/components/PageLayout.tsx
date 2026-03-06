import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function PageLayout({ title, children, maxWidth = 'md' }: PageLayoutProps) {
  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth];
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className={`w-full ${widthClass}`}>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
}
