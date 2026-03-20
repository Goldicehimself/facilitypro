import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import axiosInstance from '../../api/axiosConfig';
import { ANNUAL_DISCOUNT, formatNgn, getPlanById } from '../../data/pricing';

const loadPaystack = () =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromQuery = (searchParams.get('plan') || '').toLowerCase();
  const cycleFromQuery = (searchParams.get('cycle') || 'monthly').toLowerCase();
  const returnTo = (searchParams.get('returnTo') || '').toLowerCase();
  const orgCodeFromQuery = (searchParams.get('orgCode') || '').trim().toUpperCase();

  const pendingCheckout = useMemo(() => {
    try {
      const raw = localStorage.getItem('pendingCheckout');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const resolvePlanId = (planId) => {
    const plan = getPlanById(planId);
    if (!plan || plan.id === 'enterprise') return '';
    return plan.id;
  };

  const resolvedPlanId = resolvePlanId(planFromQuery) || resolvePlanId(pendingCheckout?.plan);

  const initialCycle = cycleFromQuery === 'annual'
    ? 'annual'
    : pendingCheckout?.cycle === 'annual'
      ? 'annual'
      : 'monthly';

  const [billingCycle, setBillingCycle] = useState(initialCycle);
  const [email, setEmail] = useState(pendingCheckout?.email || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const plan = resolvedPlanId ? getPlanById(resolvedPlanId) : null;

  const totalAmount = plan
    ? billingCycle === 'annual'
      ? Math.round(plan.monthly * 12 * (1 - ANNUAL_DISCOUNT))
      : plan.monthly
    : 0;

  const amountInKobo = totalAmount * 100;

  const handlePay = async () => {
    setError('');
    if (!plan) {
      setError('Select a valid plan to continue.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your billing email.');
      return;
    }
    if (!paystackKey) {
      setError('Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.');
      return;
    }

    setStatus('loading');
    try {
      await loadPaystack();
      const reference = `fp_${resolvedPlanId}_${Date.now()}`;
      const storedOrgCode =
        localStorage.getItem('orgCode')
        || sessionStorage.getItem('orgCode')
        || '';
      const orgCode = pendingCheckout?.orgCode || orgCodeFromQuery || storedOrgCode;
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email.trim(),
        amount: amountInKobo,
        currency: 'NGN',
        ref: reference,
        metadata: {
          org_code: orgCode,
          plan: resolvedPlanId,
          billing_cycle: billingCycle,
          customer_email: email.trim(),
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: resolvedPlanId },
            { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: billingCycle },
            ...(orgCode ? [{ display_name: 'Org Code', variable_name: 'org_code', value: orgCode }] : []),
          ],
        },
        callback: (response) => {
          setStatus('success');
          try {
            localStorage.setItem('lastPayment', JSON.stringify({
              reference: response.reference,
              plan: resolvedPlanId,
              billingCycle,
              amount: totalAmount,
              email: email.trim(),
              paidAt: new Date().toISOString(),
            }));
          } catch (e) {
            // ignore storage errors
          }
          axiosInstance.post('/billing/verify', {
            reference: response.reference,
            orgCode,
            plan: resolvedPlanId,
            billingCycle,
          }, { suppressToast: true }).then((res) => {
            const billing = res?.data?.data?.billing;
            if (billing) {
              try {
                localStorage.setItem('pendingBilling', JSON.stringify(billing));
              } catch (e) {
                // ignore storage errors
              }
            }
          }).catch(() => {
            // ignore verification errors here; webhook will handle it
          });
          const redirectTarget =
            returnTo === 'billing' ? '/settings?tab=billing' : '/login';
          setTimeout(() => navigate(redirectTarget), 1500);
        },
        onClose: () => {
          setStatus('idle');
        },
      });
      handler.openIframe();
    } catch (e) {
      setStatus('idle');
      setError('Unable to load Paystack. Check your network and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-slate-600 mt-2">
            Confirm your plan and pay securely with Paystack.
          </p>

          {!plan && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              We could not determine your plan. Go back to pricing and choose a plan.
            </div>
          )}

          {plan && (
            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wide text-slate-500">Plan</div>
                  <div className="text-xl font-semibold text-slate-900">{plan.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm uppercase tracking-wide text-slate-500">Total</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {formatNgn(totalAmount)}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <label className="text-sm font-medium text-slate-700" htmlFor="billing-email">
                  Billing Email
                </label>
                <input
                  id="billing-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  placeholder="name@company.com"
                />
              </div>

              <div className="mt-6">
                <div className="text-sm font-medium text-slate-700">Billing Cycle</div>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      billingCycle === 'annual'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 text-slate-700'
                    }`}
                  >
                    Annual (20% off)
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              disabled={!plan || status === 'loading'}
              onClick={handlePay}
              className="rounded-full px-8"
            >
              {status === 'loading' ? 'Starting payment...' : 'Pay with Paystack'}
            </Button>
            <button
              type="button"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => {
                if (returnTo === 'billing') {
                  navigate('/settings?tab=billing');
                } else {
                  navigate('/pricing');
                }
              }}
            >
              {returnTo === 'billing' ? 'Back to billing' : 'Back to pricing'}
            </button>
          </div>

          {status === 'success' && (
            <div className="mt-4 text-sm text-emerald-700">
              Payment complete. Redirecting to login...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
