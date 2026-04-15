import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={[
          'block text-sm font-semibold text-slate-700',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = 'Label';
