import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Rendered above the title (e.g. back button). */
  topContent?: ReactNode;
  variant?: 'light' | 'dark';
}

export function PageLayout({ title, children, maxWidth = 'md', topContent, variant = 'dark' }: PageLayoutProps) {
  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth];
  const isDark = variant === 'dark';
  const bgClass = isDark ? 'bg-neutral-950' : 'bg-neutral-50';
  const titleClass = isDark ? 'text-white' : 'text-neutral-900';
  return (
    <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-4`}>
      <div className={`w-full ${widthClass}`}>
        {topContent && <div className="mb-2">{topContent}</div>}
        <h1 className={`text-2xl font-bold mb-6 ${titleClass}`}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
