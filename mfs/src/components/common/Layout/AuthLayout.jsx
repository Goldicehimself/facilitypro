import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  const location = useLocation();

  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: { xs: 1.5, sm: 2 },
      }}
    >
      <Container maxWidth="sm">
        <Paper className="bg-card shadow mp-auth-surface"
          sx={{
            padding: { xs: 2.5, sm: 4 },
            borderRadius: { xs: 3, sm: 2 },
            overflow: 'visible'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ position: 'relative' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;

