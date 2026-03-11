import React from 'react';

export function Avatar({ children, className = '', ...props }) {
  return (
    <div
      className={"inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted " + className}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = '', className = '', ...props }) {
  return <img src={src} alt={alt} className={"h-full w-full object-cover " + className} {...props} />;
}

export function AvatarFallback({ children, className = '', ...props }) {
  return (
    <span className={"text-sm font-semibold text-foreground " + className} {...props}>
      {children}
    </span>
  );
}

export default Avatar;