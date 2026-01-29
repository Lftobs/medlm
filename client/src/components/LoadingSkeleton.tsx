import React from 'react';

const LoadingSkeleton: React.FC<{ className?: string; lines?: number }> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse bg-slate-200 rounded h-4" style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
