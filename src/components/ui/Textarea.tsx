import React from 'react';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={[
        'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900',
        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50',
        'min-h-[120px] resize-y',
        className,
      ].join(' ')}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
