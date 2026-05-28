import React from 'react';

const Card = ({
  children,
  className = '',
  hover = true,
  glass = false,
  onClick,
  padding = 'p-5',
  ...props
}) => {
  const base = 'rounded-2xl border transition-all duration-300';

  const surface = glass
    ? 'bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-white/20 dark:border-slate-800/50'
    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80';

  const lift = hover
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-slate-950/60 hover:border-slate-200 dark:hover:border-slate-700/60 shadow-sm'
    : 'shadow-sm';

  const cursor = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`${base} ${surface} ${lift} ${cursor} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
