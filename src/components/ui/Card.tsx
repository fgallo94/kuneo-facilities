import React from 'react';

export const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={[
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={['border-b border-slate-100 px-5 py-4', className].join(' ')}>
      {children}
    </div>
  );
};

export const CardContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={['px-5 py-4', className].join(' ')}>{children}</div>;
};

export const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={[
        'text-base font-semibold text-slate-900',
        className,
      ].join(' ')}
    >
      {children}
    </h3>
  );
};
