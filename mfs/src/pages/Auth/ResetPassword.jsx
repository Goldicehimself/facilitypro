import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/api/auth';
import AuthLayout from '../../components/common/Layout/AuthLayout';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const token = searchParams.get('token') || '';
  const orgCode = (searchParams.get('orgCode') || '').toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFormErrors({});

    if (!token || !orgCode) {
      setError('Reset link is missing required information.');
      return;
    }
    const nextErrors = {};
    if (!password) nextErrors.password = 'Password is required.';
    if (password && password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      await resetPassword({ token, orgCode, password });
      setMessage('Password reset successful. You can now log in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.message || 'Unable to reset password.');
    }
  };

  return (
    <AuthLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: 520, width: '100%', padding: '2.5rem', borderRadius: 16, background: '#fff', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>Reset Password</h1>
          <p style={{ color: '#475569', marginBottom: 20 }}>Enter a new password for your account.</p>

          {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
          {message && <div style={{ color: '#16a34a', marginBottom: 12 }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <input type="hidden" value={token} readOnly />
            <input type="hidden" value={orgCode} readOnly />
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              {formErrors.password && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{formErrors.password}</div>
              )}
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              {formErrors.confirmPassword && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{formErrors.confirmPassword}</div>
              )}
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#4f46e5',
                  color: '#fff',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Password
              </button>
            </div>
          </form>

          <div style={{ marginTop: 16 }}>
            <RouterLink to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>
              Back to login
            </RouterLink>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
