import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Copyright, Wrench } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [orgCode, setOrgCode] = useState(() => localStorage.getItem('orgCode') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOrgCode, setShowOrgCode] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaDelivery, setMfaDelivery] = useState('email');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!orgCode) {
      setError('Organization code is required.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await login(
        email,
        password,
        orgCode,
        rememberMe,
        mfaRequired ? mfaToken : ''
      );
      if (result?.mfaRequired) {
        setMfaRequired(true);
        setMfaDelivery(result.delivery || 'email');
        setLoading(false);
        return;
      }
    } catch (err) {
      setLoading(false);
      const message = err?.response?.data?.message || err?.message || '';
      if (message === 'MFA_CODE_INVALID') {
        setError('Invalid or expired security code.');
        return;
      }
      const normalized = message.toLowerCase();
      if (normalized.includes('organization email is not verified')) {
        setError('Please verify your organization email before logging in.');
      } else if (normalized.includes('user email is not verified')) {
        setError('Please verify your email before logging in.');
      } else if (normalized.includes('mfa') || normalized.includes('security code')) {
        setError('Invalid or expired security code.');
      } else {
        setError('Invalid email or password.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <RouterLink className="auth-brand" to="/" aria-label="FacilityPro home">
          <div className={`auth-logo-mark ${loading ? 'logo-spin-slow' : ''}`} aria-hidden="true">
            <Wrench size={28} />
          </div>
        </RouterLink>

        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your facility management dashboard</p>
          <RouterLink className="auth-back" to="/">
            <ArrowLeft size={14} />
            Back to home
          </RouterLink>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {mfaRequired && !error && (
          <div className="auth-info">A security code was sent to your email.</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={mfaRequired}
            />
          </div>

          <div className="auth-field auth-field--icon">
            <label htmlFor="login-org-code">Organization Code</label>
            <div className="auth-input-wrap">
              <input
                id="login-org-code"
                type={showOrgCode ? 'text' : 'password'}
                placeholder="Enter organization code"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                maxLength={12}
                autoComplete="off"
                disabled={mfaRequired}
              />
              <button
                className="auth-icon-btn"
                type="button"
                aria-label={showOrgCode ? 'Hide org code' : 'Show org code'}
                onClick={() => setShowOrgCode(!showOrgCode)}
              >
                {showOrgCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field auth-field--icon">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={mfaRequired}
              />
              <button
                className="auth-icon-btn"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!mfaRequired && (
            <div className="auth-row">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <RouterLink className="auth-link" to="/forgot-password">
                Forgot password?
              </RouterLink>
            </div>
          )}

          {mfaRequired && (
            <div className="auth-field">
              <label htmlFor="login-mfa">Security Code</label>
              <input
                id="login-mfa"
                type="text"
                placeholder={`Enter the code sent via ${mfaDelivery}`}
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <button
                className="auth-link mt-2"
                type="button"
                onClick={async () => {
                  setError('');
                  try {
                    setLoading(true);
                    const result = await login(email, password, orgCode, rememberMe, '');
                    if (result?.mfaRequired) {
                      setMfaDelivery(result.delivery || 'email');
                    }
                  } catch (err) {
                    setError('Unable to resend security code.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Resend code
              </button>
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mfaRequired ? 'Verifying...' : 'Signing In...'}
              </>
            ) : (
              mfaRequired ? 'Verify Code' : 'Sign In'
            )}
          </button>

          <div className="auth-alt">
            Don&apos;t have an account?{' '}
            <RouterLink className="auth-link" to="/register">
              Sign up
            </RouterLink>
          </div>
        </form>

        <div className="auth-footer">
          <div className="auth-footer-text">
            <Copyright size={12} />
            2026 FacilityPro. All rights reserved.
          </div>
          <div className="auth-footer-links">
            <RouterLink to="/terms">Terms of Service</RouterLink>
            <RouterLink to="/privacy">Privacy Policy</RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
