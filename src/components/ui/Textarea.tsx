import React from 'react';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={[
        'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal',
        'placeholder:text-gray-400',
        'focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
        'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        'min-h-[120px] resize-y',
        className,
      ].join(' ')}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
