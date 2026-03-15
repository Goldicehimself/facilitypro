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
      await login(email, password, orgCode, rememberMe);
    } catch (err) {
      setLoading(false);
      const message = err?.response?.data?.message || err?.message || '';
      const normalized = message.toLowerCase();
      if (normalized.includes('organization email is not verified')) {
        setError('Please verify your organization email before logging in.');
      } else if (normalized.includes('user email is not verified')) {
        setError('Please verify your email before logging in.');
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

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing In...
              </>
            ) : (
              'Sign In'
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
