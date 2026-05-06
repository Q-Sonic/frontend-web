import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = 'Volver', className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded ${className}`.trim()}
      aria-label={label}
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </button>
  );
}
