import React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={[
        'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal',
        'placeholder:text-gray-400',
        'focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
        'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    />
  );
});

Input.displayName = 'Input';
