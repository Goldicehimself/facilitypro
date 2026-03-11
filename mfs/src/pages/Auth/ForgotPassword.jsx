import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { requestPasswordReset } from '@/api/auth';

const ForgotPassword = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [email, setEmail] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !orgCode.trim()) {
      setError('Please enter your email and organization code.');
      return;
    }

    try {
      await requestPasswordReset(email.trim(), orgCode.trim().toUpperCase());
      setMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setError(err?.message || 'Unable to process password reset. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography component="h1" variant="h4" align="center" gutterBottom>
        Reset Password
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
        Enter your email address and we'll send you a link to reset your password
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="orgCode"
        label="Organization Code"
        name="orgCode"
        value={orgCode}
        onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
        sx={{
          '& .MuiOutlinedInput-root': {
            background: isDark ? '#0f172a' : '#fff',
            color: isDark ? '#e2e8f0' : '#0f172a',
            '& fieldset': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
          },
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            background: isDark ? '#0f172a' : '#fff',
            color: isDark ? '#e2e8f0' : '#0f172a',
            '& fieldset': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
          },
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, backgroundColor: 'var(--mp-brand)', color: '#ffffff', '&:hover': { backgroundColor: 'var(--mp-brand-dark)' } }}
      >
        Send Reset Link
      </Button>
      <Box textAlign="center">
        <Link href="/login" variant="body2" sx={{ color: 'var(--mp-brand)', '&:hover': { color: 'var(--mp-brand-dark)' } }}>
          Back to login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPassword;

