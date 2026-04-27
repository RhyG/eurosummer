import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-terracotta text-cream hover:bg-terracotta/90 shadow-sm',
        secondary: 'bg-ink/5 text-ink hover:bg-ink/10',
        ghost: 'bg-transparent text-ink hover:bg-ink/5',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-ink/15 bg-cream text-ink hover:bg-ink/5',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
