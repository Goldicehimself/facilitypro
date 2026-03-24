import React, { useEffect, useState } from 'react';
import { Eye, EyeOff,Copyright, Wrench } from 'lucide-react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import './Register.css';
import { isEmailAllowedByPolicy } from '../../utils/securityPolicy';
import { getPublicOrgSecurityPolicy } from '../../api/org';

const isPhoneValid = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
};

const schema = yup.object({
  mode: yup.string().oneOf(['org', 'join']).required(),
  organizationName: yup.string().when('mode', {
    is: 'org',
    then: (s) => s.required('Organization name is required'),
    otherwise: (s) => s.optional(),
  }),
  industry: yup.string().optional(),
  orgCode: yup.string().optional(),
  inviteCode: yup.string().optional(),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup
    .string()
    .required('Phone number is required')
    .test('phone-basic', 'Phone number is invalid', (value) => isPhoneValid(value)),
  department: yup.string().optional(),
  password: yup.string().min(6).required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required(),
  role: yup.string().when(['mode', 'inviteCode'], {
    is: (mode, inviteCode) => mode === 'join' && !inviteCode,
    then: (s) => s.required('Role is required'),
    otherwise: (s) => s.optional(),
  }),
}).test(
  'org-or-invite',
  'Organization code or invite code is required',
  (values) => values?.mode !== 'join' || !!(values.orgCode || values.inviteCode)
);

const Register = () => {
  const { register: registerUser } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteCodeFromQuery = searchParams.get('invite') || '';
  const planFromQuery = (searchParams.get('plan') || '').toLowerCase();
  const cycleFromQuery = (searchParams.get('cycle') || 'monthly').toLowerCase();
  const checkoutPlan = ['starter', 'pro'].includes(planFromQuery) ? planFromQuery : '';
  const checkoutCycle = cycleFromQuery === 'annual' ? 'annual' : 'monthly';
  const checkoutRedirect = checkoutPlan ? `/checkout?plan=${checkoutPlan}&cycle=${checkoutCycle}` : '';
  
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgCreatedCode, setOrgCreatedCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOrgCode, setShowOrgCode] = useState(false);
  const [orgSecurityPolicy, setOrgSecurityPolicy] = useState({ restrictInviteDomains: false, allowedInviteDomains: [] });
  const [policyLoaded, setPolicyLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      mode: inviteCodeFromQuery ? 'join' : 'org',
      inviteCode: inviteCodeFromQuery || '',
      role: 'technician',
    },
  });

  const mode = watch('mode');
  const inviteCode = watch('inviteCode');
  const orgCode = watch('orgCode');
  const watchedEmail = watch('email');
  const orgCodeRegister = register('orgCode');
  const inviteCodeRegister = register('inviteCode');
  const showDomainHint = policyLoaded && orgSecurityPolicy.restrictInviteDomains;

  useEffect(() => {
    const currentOrgCode = (orgCode || '').trim().toUpperCase();
    const currentInvite = (inviteCode || inviteCodeFromQuery || '').trim().toUpperCase();
    if (!currentOrgCode && !currentInvite) {
      setOrgSecurityPolicy({ restrictInviteDomains: false, allowedInviteDomains: [] });
      setPolicyLoaded(false);
      return;
    }

    let isMounted = true;
    const loadPolicy = async () => {
      try {
        const data = await getPublicOrgSecurityPolicy({
          orgCode: currentInvite ? undefined : (currentOrgCode || undefined),
          inviteCode: currentInvite || undefined,
        });
        if (!isMounted) return;
        setOrgSecurityPolicy(data?.securityPolicy || { restrictInviteDomains: false, allowedInviteDomains: [] });
        setPolicyLoaded(true);
      } catch {
        if (!isMounted) return;
        setOrgSecurityPolicy({ restrictInviteDomains: false, allowedInviteDomains: [] });
        setPolicyLoaded(false);
      }
    };
    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, [orgCode, inviteCode, inviteCodeFromQuery]);

  const onSubmit = async (data) => {
    setServerError('');

    const {
      mode: submitMode,
      organizationName,
      industry,
      orgCode,
      inviteCode,
      firstName,
      lastName,
      email,
      phone,
      department,
      password,
      role,
    } = data;
    if ((submitMode === 'join' || inviteCode) && !isEmailAllowedByPolicy(email, orgSecurityPolicy)) {
      toast.error('This organization restricts invites to approved email domains.');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      mode: submitMode,
      organizationName,
      industry,
      orgCode: orgCode?.toUpperCase(),
      inviteCode: inviteCode?.toUpperCase(),
      firstName,
      lastName,
      email,
      phone,
      department,
      password,
      role,
      postRegisterRedirect: checkoutRedirect || undefined,
    });

    setLoading(false);
    if (!result.success) {
      const msg = result.error || 'Registration failed.';
      setServerError(msg);
      toast.error(msg);
    } else {
      if (checkoutPlan) {
        try {
          const resolvedOrgCode = result.orgCode || orgCode?.toUpperCase() || '';
          localStorage.setItem('pendingCheckout', JSON.stringify({
            plan: checkoutPlan,
            cycle: checkoutCycle,
            email,
            orgCode: resolvedOrgCode,
            name: [firstName, lastName].filter(Boolean).join(' '),
            createdAt: new Date().toISOString(),
          }));
        } catch (e) {
          // ignore storage errors
        }
      }
    }

    if (submitMode === 'org' && result.orgCode) {
      setOrgCreatedCode(result.orgCode);
      toast.success(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Organization created</div>
            <div style={{ fontSize: 13 }}>
              This is your org code for login and invitations:
              <strong style={{ marginLeft: 6 }}>{result.orgCode}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(result.orgCode);
                  toast.info('Org code copied');
                }
              }}
              style={{
                alignSelf: 'flex-start',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Copy org code
            </button>
          </div>,
          { autoClose: 9000 }
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--tall">
        <RouterLink className="auth-brand" to="/" aria-label="FacilityPro home">
          <div className={`auth-logo-mark ${loading ? 'logo-spin-slow' : ''}`} aria-hidden="true">
            <Wrench size={28} />
          </div>
        </RouterLink>

        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Start your 14-day free trial or join your team in minutes.</p>
        </div>

        {serverError && <div className="auth-error">{serverError}</div>}
        {orgCreatedCode && (
          <div className="auth-banner auth-banner--invite" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Organization created successfully</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              This is your org code for login and invitations:
              <strong style={{ marginLeft: 6 }}>{orgCreatedCode}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText(orgCreatedCode);
                    toast.info('Org code copied');
                  }
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Copy org code
              </button>
              <RouterLink className="auth-link" to="/login">
                Go to Login
              </RouterLink>
            </div>
            <div style={{ fontSize: 12, marginTop: 8, color: '#475569' }}>
              We sent a verification email with your org code and instructions.
            </div>
          </div>
        )}
        {showDomainHint && (
          <div className="auth-banner auth-banner--invite">
            Invites are restricted to approved email domains for this organization.
          </div>
        )}
        {inviteCodeFromQuery && (
          <div className="auth-banner auth-banner--invite">
            You’re joining via an invite. Your organization and role will be set automatically.
          </div>
        )}

        {!orgCreatedCode && (
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <input type="hidden" {...register('mode')} />

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'org' ? 'is-active' : ''}`}
              onClick={() => setValue('mode', 'org')}
            >
              Create Organization
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'join' ? 'is-active' : ''}`}
              onClick={() => setValue('mode', 'join')}
            >
              Join Organization
            </button>
          </div>

          {mode === 'org' && (
            <>
              <div className="auth-field">
                <label htmlFor="register-org-name">Organization Name</label>
                <input
                  id="register-org-name"
                  type="text"
                  placeholder="Organization name"
                  {...register('organizationName')}
                />
                {errors.organizationName && (
                  <div className="auth-helper auth-helper--error">
                    {errors.organizationName.message}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="register-industry">Industry (optional)</label>
                <input
                  id="register-industry"
                  type="text"
                  placeholder="Industry"
                  {...register('industry')}
                />
                {errors.industry && (
                  <div className="auth-helper auth-helper--error">
                    {errors.industry.message}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'join' && (
            <>
              <div className="auth-field auth-field--icon">
                <label htmlFor="register-org-code">Organization Code</label>
                <div className="auth-input-wrap">
                  <input
                    id="register-org-code"
                    type={showOrgCode ? 'text' : 'password'}
                    placeholder="Organization code"
                    maxLength={12}
                    {...orgCodeRegister}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      orgCodeRegister.onChange(e);
                      setValue('orgCode', value, { shouldValidate: true });
                    }}
                  />
                  <button
                    className="auth-icon-btn"
                    type="button"
                    onClick={() => setShowOrgCode(v => !v)}
                    aria-label={showOrgCode ? 'Hide org code' : 'Show org code'}
                  >
                    {showOrgCode ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.orgCode && (
                  <div className="auth-helper auth-helper--error">
                    {errors.orgCode.message}
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="register-invite-code">Invite Code (optional)</label>
                <input
                  id="register-invite-code"
                  type="text"
                  placeholder="Invite code"
                  maxLength={12}
                  {...inviteCodeRegister}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    inviteCodeRegister.onChange(e);
                    setValue('inviteCode', value, { shouldValidate: true });
                  }}
                />
                {errors.inviteCode && (
                  <div className="auth-helper auth-helper--error">
                    {errors.inviteCode.message}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="register-first-name">First Name</label>
            <input
              id="register-first-name"
              type="text"
              placeholder="First name"
              {...register('firstName')}
            />
            {errors.firstName && (
              <div className="auth-helper auth-helper--error">
                {errors.firstName.message}
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-last-name">Last Name</label>
            <input
              id="register-last-name"
              type="text"
              placeholder="Last name"
              {...register('lastName')}
            />
            {errors.lastName && (
              <div className="auth-helper auth-helper--error">
                {errors.lastName.message}
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              autoComplete="email"
            />
            {showDomainHint && watchedEmail && !isEmailAllowedByPolicy(watchedEmail, policy) && (
              <div className="auth-helper auth-helper--error">
                This email domain is not approved for this organization.
              </div>
            )}
            {errors.email && (
              <div className="auth-helper auth-helper--error">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="auth-field auth-field--phone">
            <label htmlFor="register-phone">Phone Number</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry="us"
                  value={field.value ?? ''}
                  onChange={(value) => field.onChange(value)}
                  style={{ width: '100%' }}
                  inputProps={{
                    id: 'register-phone',
                    name: field.name,
                    onBlur: field.onBlur,
                    autoComplete: 'tel',
                  }}
                />
              )}
            />
            {errors.phone && (
              <div className="auth-helper auth-helper--error">
                {errors.phone.message}
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-dept">Department (optional)</label>
            <input
              id="register-dept"
              type="text"
              placeholder="Department"
              {...register('department')}
            />
            {errors.department && (
              <div className="auth-helper auth-helper--error">
                {errors.department.message}
              </div>
            )}
          </div>

          <div className="auth-field auth-field--icon">
            <label htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                {...register('password')}
                autoComplete="new-password"
              />
              <button
                className="auth-icon-btn"
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="auth-helper auth-helper--error">
                {errors.password.message}
              </div>
            )}
          </div>

          <div className="auth-field auth-field--icon">
            <label htmlFor="register-confirm">Confirm Password</label>
            <div className="auth-input-wrap">
              <input
                id="register-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              <button
                className="auth-icon-btn"
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="auth-helper auth-helper--error">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          {mode === 'join' && (
            <div className="auth-field">
              <label htmlFor="register-role">Role</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select
                    id="register-role"
                    className="auth-select"
                    disabled={!!inviteCode}
                    {...field}
                  >
                    <option value="facility_manager">Facility Manager</option>
                    <option value="technician">Maintenance Technician</option>
                    <option value="vendor">Vendor</option>
                    <option value="staff">Staff</option>
                    <option value="finance">Finance</option>
                  </select>
                )}
              />
              {errors.role && (
                <div className="auth-helper auth-helper--error">
                  {errors.role.message}
                </div>
              )}
            </div>
          )}

          <label className="auth-check auth-check--terms">
            <input type="checkbox" defaultChecked />
            I agree to the{' '}
            <RouterLink className="auth-link" to="/terms">
              Terms and Conditions
            </RouterLink>
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="auth-alt">
            Already have an account?{' '}
            <RouterLink className="auth-link" to="/login">
              Log in
            </RouterLink>
          </div>
        </form>
        )}

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

export default Register;
