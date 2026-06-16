import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

function Button({ loading, variant = 'primary', children, disabled, className = '', ...props }: ButtonProps) {
  const base = 'h-touch-target px-6 font-space font-bold uppercase inline-flex items-center justify-center gap-2 brutalist-border brutalist-shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-on-primary hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
    secondary: 'bg-white text-on-surface border-2 border-black hover:bg-accent-ochre/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    danger: 'bg-white text-live-red border-2 border-live-red hover:bg-live-red hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
