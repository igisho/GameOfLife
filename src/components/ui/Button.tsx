import * as React from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'default' | 'primary' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANTS: Record<ButtonVariant, string> = {
  default:
    'border-[var(--control-border)] bg-[var(--control)] hover:bg-[var(--control-hover)] focus:ring-[var(--primary)]',
  primary: 'border-[var(--primary)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]',
  danger:
    'border-[var(--danger-border)] bg-[var(--danger)] hover:bg-[var(--danger-hover)] focus:ring-[var(--primary)]',
};

export default function Button({ className, variant = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-10 w-full items-center justify-center rounded-xl border px-3 text-sm font-medium text-[var(--text)] shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-50',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
