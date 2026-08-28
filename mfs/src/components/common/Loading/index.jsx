import React from 'react';

export default function Loading({ label = 'Loading your workspace', fullScreen = false, compact = false, className = '' }) {
  return (
    <div className={`facility-loader-wrap ${fullScreen ? 'facility-loader-screen' : ''} ${compact ? 'facility-loader-compact' : ''} ${className}`} role="status" aria-live="polite">
      <div className="loader" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="circle" key={index}><span className="dot" /><span className="outline" /></div>
        ))}
      </div>
      {label && <p className="facility-loader-label">{label}</p>}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  );
}
