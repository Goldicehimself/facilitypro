import React, { useState } from 'react';
import { Alert, Box, Button, CircularProgress, TextField } from '@mui/material';
import { ArrowLeft, Building2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/api/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ForgotPassword = () => {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim() || !orgCode.trim()) return setError('Please enter your email and organization code.');
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Enter a complete email address, such as name@company.com.');

    try {
      setLoading(true);
      const result = await requestPasswordReset(email.trim(), orgCode.trim().toUpperCase());
      if (result?.sent) setMessage('Check your inbox. If the account exists, we have sent a secure reset link.');
      else setError('We could not send the reset email right now. Please try again later.');
    } catch (err) {
      setError(err?.message || 'Unable to process password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      minHeight: 54, borderRadius: '14px', backgroundColor: '#f8fafc',
      transition: 'background-color .2s ease, box-shadow .2s ease',
      '& fieldset': { borderColor: '#dbe3ef' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused': { backgroundColor: '#fff', boxShadow: '0 0 0 4px rgba(37,99,235,.10)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--mp-brand)', borderWidth: '1.5px' },
    },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,.28),transparent_32%),radial-gradient(circle_at_90%_80%,rgba(14,165,233,.18),transparent_30%)]" />
      <motion.div aria-hidden="true" className="absolute -left-20 top-20 h-64 w-64 rounded-full border border-blue-400/10"
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [.35, .7, .35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.section
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_32px_90px_-30px_rgba(2,6,23,.75)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400" />
        <div className="p-6 sm:p-9">
          <div className="mb-7 text-center">
            <motion.div initial={reduceMotion ? false : { rotate: -12, scale: .7 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: .15, type: 'spring', stiffness: 230, damping: 16 }}
              className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/25">
              <KeyRound className="h-7 w-7" />
            </motion.div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.24em] text-blue-700">Account recovery</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Reset your password</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">Enter your workspace details and we’ll email you a secure password reset link.</p>
          </div>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {(error || message) && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2.5, borderRadius: '14px' }}>{error || message}</Alert>
            </motion.div>}

            <div className="space-y-4">
              <div>
                <label htmlFor="orgCode" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Building2 className="h-4 w-4 text-blue-700" /> Organization code</label>
                <TextField required fullWidth id="orgCode" name="orgCode" placeholder="e.g. FACILITY-01" value={orgCode}
                  onChange={(event) => setOrgCode(event.target.value.toUpperCase())} inputProps={{ maxLength: 40 }} sx={fieldStyles} />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Mail className="h-4 w-4 text-blue-700" /> Work email address</label>
                <TextField required fullWidth id="email" name="email" type="email" autoComplete="email" placeholder="name@company.com"
                  value={email} onChange={(event) => setEmail(event.target.value)} sx={fieldStyles} />
              </div>
            </div>

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Mail size={18} />}
              sx={{ mt: 3, minHeight: 54, borderRadius: '999px', textTransform: 'none', fontSize: 16, fontWeight: 700,
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 12px 28px -12px rgba(37,99,235,.75)',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&:hover': { background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', transform: 'translateY(-2px)', boxShadow: '0 16px 32px -12px rgba(37,99,235,.8)' } }}>
              {loading ? 'Sending secure link…' : 'Send reset link'}
            </Button>
          </Box>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Link to="/login" className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to sign in
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure recovery</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default ForgotPassword;
