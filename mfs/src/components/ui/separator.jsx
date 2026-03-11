import React from 'react';

export function Separator({ className = '', ...props }) {
  return <div role="separator" className={"h-px bg-border my-2 " + className} {...props} />;
}

export default Separator;