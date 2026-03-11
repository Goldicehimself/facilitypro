import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ImageLightbox({ src, alt = '', onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-[90vw] max-h-[90vh] overflow-hidden rounded-lg"
      >
        <img src={src} alt={alt} className="w-full h-auto max-h-[90vh] object-contain" />
      </motion.div>
    </div>
  );
}
