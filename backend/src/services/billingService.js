const https = require('https');
const crypto = require('crypto');
const Organization = require('../models/Organization');
const { ValidationError, NotFoundError } = require('../utils/errorHandler');
const { PRICING_PLANS, ANNUAL_DISCOUNT } = require('../constants/pricing');

const PAYSTACK_API_HOST = 'api.paystack.co';

const normalizePlanId = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'professional') return 'pro';
  if (raw === 'starter' || raw === 'pro' || raw === 'enterprise') return raw;
  return '';
};

const normalizeBillingCycle = (value) => {
  const raw = String(value || '').toLowerCase();
  return raw === 'annual' ? 'annual' : 'monthly';
};

const getMetadataValue = (metadata, key) => {
  if (!metadata) return '';
  if (metadata[key]) return metadata[key];
  const customFields = Array.isArray(metadata.custom_fields) ? metadata.custom_fields : [];
  const match = customFields.find((field) => field?.variable_name === key);
  return match?.value || '';
};

const getExpectedAmount = (planId, billingCycle) => {
  const plan = PRICING_PLANS[planId];
  if (!plan) return 0;
  if (billingCycle === 'annual') {
    return Math.round(plan.monthly * 12 * (1 - ANNUAL_DISCOUNT));
  }
  return plan.monthly;
};

const paystackRequest = (path, secretKey) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: PAYSTACK_API_HOST,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const payload = JSON.parse(raw || '{}');
            if (res.statusCode >= 400) {
              return reject(new Error(payload?.message || 'Paystack request failed'));
            }
            resolve(payload);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });

const verifyPaystackTransaction = async (reference) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACKSECRET_KEY;
  if (!secretKey) {
    throw new ValidationError('Paystack secret key not configured');
  }
  const payload = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, secretKey);
  if (!payload?.status || !payload?.data) {
    throw new ValidationError('Unable to verify Paystack transaction');
  }
  return payload.data;
};

const applyBillingUpdate = async ({
  orgCode,
  planId,
  billingCycle,
  amount,
  reference,
  paidAt,
  provider = 'paystack',
}) => {
  if (!orgCode) {
    throw new ValidationError('Organization code is required');
  }

  const normalizedPlan = normalizePlanId(planId);
  if (!normalizedPlan || normalizedPlan === 'enterprise') {
    throw new ValidationError('Unsupported plan for automatic billing');
  }

  const plan = PRICING_PLANS[normalizedPlan];
  if (!plan) {
    throw new ValidationError('Invalid plan');
  }

  const organization = await Organization.findOne({ orgCode: String(orgCode).toUpperCase() });
  if (!organization) {
    throw new NotFoundError('Organization');
  }

  const currentBilling = organization.settings?.billing || {};
  const nextSeatCount = Math.max(Number(currentBilling.seatCount || 0), Number(plan.seatsIncluded || 0), 1);

  organization.settings = organization.settings || {};
  organization.settings.billing = {
    ...currentBilling,
    plan: normalizedPlan,
    billingCycle: normalizeBillingCycle(billingCycle),
    seatsIncluded: plan.seatsIncluded,
    extraSeatPrice: plan.extraSeatPrice,
    seatCount: nextSeatCount,
    trialEndsAt: null,
    status: 'active',
    provider,
    lastPaidAt: paidAt ? new Date(paidAt) : new Date(),
    lastPaymentReference: reference || currentBilling.lastPaymentReference,
    lastPaymentAmount: amount || currentBilling.lastPaymentAmount,
  };

  await organization.save();

  return {
    orgId: organization._id,
    orgCode: organization.orgCode,
    billing: organization.settings.billing,
  };
};

const verifyAndActivate = async ({ reference, orgCode, plan, billingCycle }) => {
  if (!reference) {
    throw new ValidationError('Payment reference is required');
  }

  const transaction = await verifyPaystackTransaction(reference);
  const status = String(transaction.status || '').toLowerCase();
  if (status !== 'success') {
    throw new ValidationError('Payment not successful');
  }

  const metadata = transaction.metadata || {};
  const resolvedPlan = normalizePlanId(plan || metadata.plan || getMetadataValue(metadata, 'plan'));
  const resolvedCycle = normalizeBillingCycle(billingCycle || metadata.billing_cycle || getMetadataValue(metadata, 'billing_cycle'));
  const resolvedOrgCode = orgCode || metadata.org_code || getMetadataValue(metadata, 'org_code');
  const currency = String(transaction.currency || '').toUpperCase();
  if (currency && currency !== 'NGN') {
    throw new ValidationError('Unsupported currency');
  }

  const amountPaid = Number(transaction.amount || 0) / 100;
  const expected = getExpectedAmount(resolvedPlan, resolvedCycle);
  if (expected && amountPaid < expected) {
    throw new ValidationError('Payment amount is lower than expected');
  }

  return applyBillingUpdate({
    orgCode: resolvedOrgCode,
    planId: resolvedPlan,
    billingCycle: resolvedCycle,
    amount: amountPaid,
    reference: transaction.reference || reference,
    paidAt: transaction.paid_at || transaction.paidAt,
  });
};

const handleWebhook = async ({ rawBody, signature }) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACKSECRET_KEY;
  if (!secretKey) {
    throw new ValidationError('Paystack secret key not configured');
  }

  const bodyBuffer = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(JSON.stringify(rawBody || {}));
  const signatureExpected = crypto.createHmac('sha512', secretKey).update(bodyBuffer).digest('hex');
  if (!signature || signature !== signatureExpected) {
    throw new ValidationError('Invalid Paystack signature');
  }

  const payload = JSON.parse(bodyBuffer.toString('utf8') || '{}');
  if (payload.event !== 'charge.success') {
    return { received: true, ignored: true };
  }

  const data = payload.data || {};
  const metadata = data.metadata || {};

  const resolvedPlan = normalizePlanId(metadata.plan || getMetadataValue(metadata, 'plan'));
  const resolvedCycle = normalizeBillingCycle(metadata.billing_cycle || getMetadataValue(metadata, 'billing_cycle'));
  const resolvedOrgCode = metadata.org_code || getMetadataValue(metadata, 'org_code');
  const currency = String(data.currency || '').toUpperCase();
  if (currency && currency !== 'NGN') {
    throw new ValidationError('Unsupported currency');
  }
  const amountPaid = Number(data.amount || 0) / 100;

  const expected = getExpectedAmount(resolvedPlan, resolvedCycle);
  if (expected && amountPaid < expected) {
    throw new ValidationError('Payment amount is lower than expected');
  }

  const result = await applyBillingUpdate({
    orgCode: resolvedOrgCode,
    planId: resolvedPlan,
    billingCycle: resolvedCycle,
    amount: amountPaid,
    reference: data.reference,
    paidAt: data.paid_at || data.paidAt,
  });

  return { received: true, result };
};

module.exports = {
  verifyAndActivate,
  handleWebhook,
};
