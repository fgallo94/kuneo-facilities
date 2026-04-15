import React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={[
        'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    />
  );
});

Input.displayName = 'Input';
