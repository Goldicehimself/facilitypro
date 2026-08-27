import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  const location = useLocation();

  return (
    <main
      role="main"
      className="min-h-screen w-full overflow-x-hidden bg-slate-50"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

export default AuthLayout;

