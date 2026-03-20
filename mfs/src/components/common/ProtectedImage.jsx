import React, { useEffect, useMemo, useState } from 'react';

const buildUploadUrl = (filePath) => {
  if (!filePath) return '';
  const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
  const base = apiBase.endsWith('/api/v1') ? apiBase.slice(0, -7) : apiBase;
  return `${base}/${filePath.replace(/^\/+/, '')}`;
};

const isUploadPath = (value) =>
  typeof value === 'string' &&
  (value.startsWith('uploads/') || value.includes('/uploads/'));

export default function ProtectedImage({
  src,
  alt,
  className = '',
  style = {},
  fallback = '/placeholder-asset.svg',
  cacheKey,
  onClick,
  imgProps = {},
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [objectUrl, setObjectUrl] = useState(null);

  const resolvedSrc = useMemo(() => {
    if (!src) return fallback;
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    if (isUploadPath(src)) {
      const baseUrl = buildUploadUrl(src);
      if (!cacheKey) return baseUrl;
      const sep = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${sep}v=${encodeURIComponent(cacheKey)}`;
    }
    return src;
  }, [src, fallback, cacheKey]);

  useEffect(() => {
    let active = true;
    let localObjectUrl = null;

    const loadProtected = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(resolvedSrc, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Failed to load image');
        const blob = await response.blob();
        localObjectUrl = URL.createObjectURL(blob);
        if (active) {
          setObjectUrl(localObjectUrl);
          setCurrentSrc(localObjectUrl);
        }
      } catch (error) {
        if (active) setCurrentSrc(fallback);
      }
    };

    const shouldFetch =
      !!resolvedSrc &&
      isUploadPath(src) &&
      !resolvedSrc.startsWith('data:') &&
      !resolvedSrc.startsWith('blob:');

    if (shouldFetch) {
      loadProtected();
    } else {
      setCurrentSrc(resolvedSrc || fallback);
    }

    return () => {
      active = false;
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [resolvedSrc, src, fallback]);

  const safeSrc = currentSrc ? encodeURI(currentSrc) : currentSrc;

  const handleError = (e) => {
    if (currentSrc === fallback) return;
    setCurrentSrc(fallback);
    e?.target?.removeAttribute('onerror');
  };

  return (
    <img
      src={safeSrc}
      alt={alt || 'image'}
      loading="lazy"
      onError={handleError}
      onClick={onClick}
      className={className}
      style={style}
      {...imgProps}
    />
  );
}
