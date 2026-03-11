// Fund Request Controller
const fundService = require('../services/fundService');
const notificationService = require('../services/notificationService');
const response = require('../utils/response');
const { AuthorizationError } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/email');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { renderTemplate } = require('../utils/emailTemplates');

const getSupportEmail = (organization) => {
  const orgSupport = organization?.settings?.companyProfile?.supportEmail;
  return orgSupport || process.env.SUPPORT_EMAIL || 'support@facilitypro.local';
};

const getRecipientName = (user) => {
  const first = user?.firstName || '';
  const last = user?.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || user?.email || 'there';
};

const createFundRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'finance') {
      throw new AuthorizationError('Only finance can request funds');
    }
    const fund = await fundService.createFundRequest(req.user.organization, req.user.id, req.validatedData || req.body);
    const adminRecipients = await notificationService.getRoleUserIds(['admin'], req.user.organization);
    if (adminRecipients.length > 0) {
      const requesterName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Finance user';
      await notificationService.createNotificationsForUsers(adminRecipients, {
        organization: req.user.organization,
        title: 'New fund request',
        message: `${requesterName} requested ${fund.amount} for ${fund.purpose || 'a fund request'}`,
        type: 'fund_request_created',
        entityType: 'FundRequest',
        entityId: fund._id,
        link: '/finance-portal',
        metadata: {
          requesterId: req.user.id,
          requesterName,
          amount: fund.amount,
          purpose: fund.purpose
        }
      });
      const org = await Organization.findById(req.user.organization)
        .select('name orgCode settings.companyProfile.supportEmail settings.notifications.notifyEmail')
        .lean();
      if (org?.settings?.notifications?.notifyEmail === false) {
        response.created(res, 'Fund request submitted', fund);
        return;
      }
      const admins = await User.find({ _id: { $in: adminRecipients }, active: true })
        .select('email firstName lastName')
        .lean();
      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      for (const admin of admins) {
        if (!admin.email) continue;
        const personalizedHtml = renderTemplate('facilitypro-transactional.html', {
          preheader_text: 'A new fund request was submitted.',
          header_badge: 'Finance Update',
          headline: 'New fund request',
          recipient_name: getRecipientName(admin),
          body_copy: `${requesterName} submitted a fund request for ${fund.purpose || 'a request'} (${fund.amount}).`,
          action_url: `${frontendBaseUrl}/finance-portal`,
          action_label: 'Review request',
          org_name: org?.name || 'FacilityPro',
          org_code: org?.orgCode || '',
          requester_name: req.user?.email || '',
          request_time: new Date().toLocaleString(),
          support_email: getSupportEmail(org),
          footer_note: 'Review and approve or reject this request in the finance portal.',
          year: new Date().getFullYear()
        });
        await sendEmail({
          to: admin.email,
          subject: 'New fund request submitted',
          text: `${requesterName} submitted a fund request for ${fund.purpose || 'a request'} (${fund.amount}).`,
          html: personalizedHtml || undefined
        });
      }
    }
    response.created(res, 'Fund request submitted', fund);
  } catch (error) {
    next(error);
  }
};

const listFunds = async (req, res, next) => {
  try {
    const funds = await fundService.listFunds(req.user.organization, req.validatedQuery || req.query);
    response.success(res, 'Fund requests retrieved', funds);
  } catch (error) {
    next(error);
  }
};

const listMyFunds = async (req, res, next) => {
  try {
    const funds = await fundService.listMyFunds(req.user.organization, req.user.id, req.validatedQuery || req.query);
    response.success(res, 'Your fund requests retrieved', funds);
  } catch (error) {
    next(error);
  }
};

const approveFund = async (req, res, next) => {
  try {
    const fund = await fundService.approveFund(req.user.organization, req.params.id, req.user.id);
    await notificationService.createNotification({
      user: fund.requestedBy,
      organization: req.user.organization,
      title: 'Fund request approved',
      message: 'Your fund request was approved.',
      type: 'fund_approved',
      entityType: 'FundRequest',
      entityId: fund._id,
      link: '/finance-portal'
    });
    if (fund.requestedBy?.email) {
      const org = await Organization.findById(req.user.organization)
        .select('name orgCode settings.companyProfile.supportEmail')
        .lean();
      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const html = renderTemplate('facilitypro-transactional.html', {
        preheader_text: 'Your fund request was approved.',
        header_badge: 'Finance Update',
        headline: 'Fund request approved',
        recipient_name: getRecipientName(fund.requestedBy),
        body_copy: `Your fund request for ${fund.purpose} (${fund.amount}) has been approved.`,
        action_url: `${frontendBaseUrl}/finance-portal`,
        action_label: 'View request',
        org_name: org?.name || 'FacilityPro',
        org_code: org?.orgCode || '',
        requester_name: fund.requestedBy?.email || '',
        request_time: new Date().toLocaleString(),
        support_email: getSupportEmail(org),
        footer_note: 'Contact finance if you have questions about this approval.',
        year: new Date().getFullYear()
      });
      await sendEmail({
        to: fund.requestedBy.email,
        subject: 'Fund request approved',
        text: `Your fund request for ${fund.purpose} (${fund.amount}) was approved.`,
        html: html || undefined
      });
    }
    response.success(res, 'Fund request approved', fund);
  } catch (error) {
    next(error);
  }
};

const rejectFund = async (req, res, next) => {
  try {
    const fund = await fundService.rejectFund(req.user.organization, req.params.id, req.user.id);
    await notificationService.createNotification({
      user: fund.requestedBy,
      organization: req.user.organization,
      title: 'Fund request rejected',
      message: 'Your fund request was rejected.',
      type: 'fund_rejected',
      entityType: 'FundRequest',
      entityId: fund._id,
      link: '/finance-portal'
    });
    if (fund.requestedBy?.email) {
      const org = await Organization.findById(req.user.organization)
        .select('name orgCode settings.companyProfile.supportEmail')
        .lean();
      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const html = renderTemplate('facilitypro-transactional.html', {
        preheader_text: 'Your fund request was rejected.',
        header_badge: 'Finance Update',
        headline: 'Fund request rejected',
        recipient_name: getRecipientName(fund.requestedBy),
        body_copy: `Your fund request for ${fund.purpose} (${fund.amount}) was rejected.`,
        action_url: `${frontendBaseUrl}/finance-portal`,
        action_label: 'View request',
        org_name: org?.name || 'FacilityPro',
        org_code: org?.orgCode || '',
        requester_name: fund.requestedBy?.email || '',
        request_time: new Date().toLocaleString(),
        support_email: getSupportEmail(org),
        footer_note: 'Contact finance if you have questions about this decision.',
        year: new Date().getFullYear()
      });
      await sendEmail({
        to: fund.requestedBy.email,
        subject: 'Fund request rejected',
        text: `Your fund request for ${fund.purpose} (${fund.amount}) was rejected.`,
        html: html || undefined
      });
    }
    response.success(res, 'Fund request rejected', fund);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFundRequest,
  listFunds,
  listMyFunds,
  approveFund,
  rejectFund
};
