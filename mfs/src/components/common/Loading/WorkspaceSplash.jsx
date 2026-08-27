import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Wrench } from 'lucide-react';

const WorkspaceSplash = ({ message = 'Preparing your workspace' }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="workspace-splash"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="workspace-splash-grid" aria-hidden="true" />
      <motion.div
        className="workspace-splash-content"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="workspace-splash-mark">
          {!reduceMotion && <span className="workspace-splash-orbit" aria-hidden="true" />}
          <div className="workspace-splash-logo">
            <Wrench className="h-8 w-8" aria-hidden="true" />
          </div>
        </div>
        <motion.div
          className="workspace-splash-brand"
          initial={reduceMotion ? false : { opacity: 0, letterSpacing: '0.28em' }}
          animate={{ opacity: 1, letterSpacing: '0.12em' }}
          transition={{ delay: 0.12, duration: 0.55 }}
        >
          FacilityPro
        </motion.div>
        <p className="workspace-splash-message">{message}</p>
        <div className="workspace-splash-track" aria-hidden="true">
          <motion.span
            initial={reduceMotion ? { width: '100%' } : { width: '8%' }}
            animate={{ width: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WorkspaceSplash;
