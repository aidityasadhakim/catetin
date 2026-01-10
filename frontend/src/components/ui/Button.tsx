import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'brutalist';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-coral text-black rounded-lg hover:opacity-90 font-mono text-sm tracking-widest uppercase shadow-sm hover:translate-y-[-1px]",
      secondary: "bg-transparent text-black border-2 border-black rounded-lg hover:bg-black hover:text-white font-mono text-sm tracking-widest uppercase",
      ghost: "bg-transparent text-black hover:bg-black/5 font-mono text-sm tracking-widest uppercase",
      brutalist: "bg-signal-orange text-black border-3 border-black rounded-none hover:bg-[#E85A2A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] font-mono text-sm font-bold tracking-[0.1em] uppercase transition-transform"
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
