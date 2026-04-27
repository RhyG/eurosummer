import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-xl border border-ink/15 bg-cream px-4 text-base placeholder:text-ink/40 focus:outline-none focus:border-terracotta/60 focus:ring-2 focus:ring-terracotta/20',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-xl border border-ink/15 bg-cream px-4 py-2 text-base placeholder:text-ink/40 focus:outline-none focus:border-terracotta/60 focus:ring-2 focus:ring-terracotta/20',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
