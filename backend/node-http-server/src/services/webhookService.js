const http = require('http');
const https = require('https');
const crypto = require('crypto');
const Organization = require('../models/Organization');
const constants = require('../constants/constants');
const { appendWebhookDeliveryLog } = require('./orgService');

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];

const sendWebhookRequest = (url, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const payload = Buffer.from(body);
    const options = {
      method: 'POST',
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        ...headers
      }
    };

    const client = target.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const buildSignatureHeaders = (secret, timestamp, payload) => {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return {
    'x-maintainpro-signature': `sha256=${signature}`,
    'x-maintainpro-timestamp': timestamp
  };
};

const formatWorkOrderLine = (workOrder = {}) => {
  const number = workOrder.workOrderNumber || workOrder.woNumber || workOrder._id || 'WO';
  const title = workOrder.title || 'Work Order';
  return `${number} — ${title}`;
};

const formatSlackTeamsText = (event, payload = {}) => {
  const workOrder = payload.workOrder || payload;
  const lines = [];

  if (event === 'workorder.created') {
    lines.push(`Work order created: ${formatWorkOrderLine(workOrder)}`);
  } else if (event === 'workorder.assigned') {
    const assignee = workOrder?.assignedTo?.name || workOrder?.assignedTo?.email || 'Unassigned';
    lines.push(`Work order assigned: ${formatWorkOrderLine(workOrder)}`);
    lines.push(`Assigned to: ${assignee}`);
  } else if (event === 'workorder.status_changed') {
    const status = payload.status || workOrder?.status || 'updated';
    lines.push(`Work order status changed: ${formatWorkOrderLine(workOrder)}`);
    lines.push(`Status: ${status}`);
  } else if (event === 'workorder.overdue') {
    lines.push(`Work order overdue: ${formatWorkOrderLine(workOrder)}`);
  } else if (event === 'pm.due') {
    const assetName = payload?.asset?.name || payload?.maintenance?.asset?.name || 'Asset';
    const dueDate = payload?.nextDueDate || payload?.maintenance?.nextDueDate || '';
    lines.push(`Preventive maintenance due: ${assetName}`);
    if (dueDate) lines.push(`Next due: ${new Date(dueDate).toLocaleString()}`);
  } else {
    lines.push(`Event: ${event}`);
  }

  const priority = workOrder?.priority ? `Priority: ${workOrder.priority}` : '';
  const location = workOrder?.location?.name || workOrder?.location || '';
  if (priority) lines.push(priority);
  if (location) lines.push(`Location: ${location}`);

  return lines.filter(Boolean).join('\n');
};

const buildWebhookBody = ({ webhook, event, payload, organizationId, timestamp }) => {
  const type = String(webhook?.type || 'generic').toLowerCase();
  if (type === 'slack' || type === 'teams') {
    return JSON.stringify({
      text: formatSlackTeamsText(event, payload)
    });
  }

  return JSON.stringify({
    event,
    data: payload,
    organizationId,
    occurredAt: timestamp
  });
};

const deliverWithRetry = async ({ organizationId, webhook, event, payload, attempt = 1 }) => {
  const timestamp = new Date().toISOString();
  const body = buildWebhookBody({ webhook, event, payload, organizationId, timestamp });
  const headers = buildSignatureHeaders(webhook.secret, timestamp, body);
  headers['x-maintainpro-event'] = event;

  try {
    const response = await sendWebhookRequest(webhook.url, body, headers);
    const success = response.statusCode >= 200 && response.statusCode < 300;
    await appendWebhookDeliveryLog(organizationId, webhook.id, {
      event,
      attempt,
      success,
      statusCode: response.statusCode,
      responseSnippet: String(response.body || '').slice(0, 500),
      createdAt: new Date()
    });

    if (!success && attempt < MAX_ATTEMPTS) {
      const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
      setTimeout(() => {
        deliverWithRetry({ organizationId, webhook, event, payload, attempt: attempt + 1 });
      }, delay);
    }
  } catch (error) {
    await appendWebhookDeliveryLog(organizationId, webhook.id, {
      event,
      attempt,
      success: false,
      error: error?.message || 'Webhook delivery failed',
      createdAt: new Date()
    });

    if (attempt < MAX_ATTEMPTS) {
      const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
      setTimeout(() => {
        deliverWithRetry({ organizationId, webhook, event, payload, attempt: attempt + 1 });
      }, delay);
    }
  }
};

const emitWebhookEvent = async (organizationId, event, payload) => {
  if (!constants.WEBHOOK_EVENTS.includes(event)) return;

  const org = await Organization.findById(organizationId).select('settings');
  if (!org) return;

  const webhooks = org.settings?.integrations?.webhooks || [];
  const targets = webhooks.filter((hook) => {
    if (!hook.active) return false;
    const events = hook.events || [];
    if (!events.length) return true;
    return events.includes(event);
  });
  if (!targets.length) return;

  targets.forEach((hook) => {
    deliverWithRetry({ organizationId, webhook: hook, event, payload, attempt: 1 });
  });
};

module.exports = {
  emitWebhookEvent
};
