import React from 'react';
import ProtectedImage from '../common/ProtectedImage';

// Simple responsive image component with fallback and lazy loading
export default function AssetImage({ src, alt, className = '', style = {}, fallback = '/placeholder-asset.svg', onClick, imgProps = {} }) {
  return (
    <ProtectedImage
      src={src}
      alt={alt || 'asset'}
      className={className}
      style={style}
      fallback={fallback}
      onClick={onClick}
      imgProps={imgProps}
    />
  );
}
