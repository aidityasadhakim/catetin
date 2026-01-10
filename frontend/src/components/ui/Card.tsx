import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'parchment' | 'technical' | 'data';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    
    const variants = {
      default: "bg-ivory border border-border rounded-lg shadow-sm p-6",
      parchment: "bg-parchment text-charcoal border border-border rounded-md p-8 shadow-inner font-accent italic leading-relaxed",
      technical: "bg-warm-cream border-2 border-black rounded-none p-6 relative technical-corners",
      data: "bg-pale-blue border border-charcoal rounded-none p-4 font-mono"
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {variant === 'technical' && (
          <>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-black" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-black" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black" />
          </>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
