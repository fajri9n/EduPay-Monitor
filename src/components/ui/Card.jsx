import React from 'react';

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs transition-all ${
        hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4 ${className}`}>
      {title || subtitle ? (
        <div>
          {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
}

