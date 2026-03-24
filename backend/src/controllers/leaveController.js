// Leave Controller
const leaveService = require('../services/leaveService');
const notificationService = require('../services/notificationService');
const response = require('../utils/response');
const { AuthorizationError } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/email');
const { renderTemplate } = require('../utils/emailTemplates');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

const sendLeaveDecisionEmail = async (organizationId, staffId, decision = 'approved') => {
  const [org, staff] = await Promise.all([
    Organization.findById(organizationId)
      .select('name orgCode settings.companyProfile.supportEmail settings.notifications.notifyEmail')
      .lean(),
    User.findById(staffId).select('email firstName lastName active').lean()
  ]);
  if (org?.settings?.notifications?.notifyEmail === false) return;
  if (!staff?.email || staff.active === false) return;
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const decisionLabel = decision === 'approved' ? 'approved' : 'rejected';
  const html = renderTemplate('facilitypro-transactional.html', {
    preheader_text: `Your leave request was ${decisionLabel}.`,
    header_badge: 'Leave Update',
    headline: `Leave request ${decisionLabel}`,
    recipient_name: getRecipientName(staff),
    body_copy: `Your leave request was ${decisionLabel} by your manager.`,
    action_url: `${frontendBaseUrl}/leave-center`,
    action_label: 'View leave',
    org_name: org?.name || 'FacilityPro',
    org_code: org?.orgCode || '',
    requester_name: staff?.email || '',
    request_time: new Date().toLocaleString(),
    support_email: getSupportEmail(org),
    footer_note: 'Contact your manager if you have questions about this decision.',
    year: new Date().getFullYear()
  });
  await sendEmail({
    to: staff.email,
    subject: `Leave request ${decisionLabel}`,
    text: `Your leave request was ${decisionLabel}.`,
    html: html || undefined
  });
};

const createLeaveRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'staff') {
      throw new AuthorizationError('Only staff can request leave');
    }
    const leave = await leaveService.createLeaveRequest(req.user.organization, req.user.id, req.validatedData || req.body);
    const recipients = await notificationService.getRoleUserIds(
      ['admin', 'facility_manager'],
      req.user.organization
    );
    console.log('Leave created:', leave._id);
    console.log('Recipients found:', recipients.length, recipients);
    
    if (recipients.length > 0) {
      const staffName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Staff member';
      console.log('Creating notifications for recipients:', recipients);
      const payload = {
        organization: req.user.organization,
        title: 'New leave request',
        message: `${staffName} submitted a ${leave.type} leave request`,
        type: 'leave_request_submitted',
        entityType: 'LeaveRequest',
        entityId: leave._id,
        link: '/leave-center',
        dedupeKey: `leave-request-${leave._id}`,
        metadata: {
          staffId: req.user.id,
          staffName,
          leaveType: leave.type,
          leaveReason: leave.reason,
          startDate: leave.startDate,
          endDate: leave.endDate
        }
      };
      const notifications = await notificationService.createNotificationsForUsers(recipients, payload, { force: true });
      console.log('Notifications created successfully:', notifications?.length || 0);
      if (notifications && notifications.length > 0) {
        console.log('First notification:', notifications[0]);
      } else {
        try {
          const docs = recipients.map((userId) => ({
            ...payload,
            user: userId,
            dedupeKey: `leave-request-${leave._id}-${userId}`
          }));
          await Notification.insertMany(docs, { ordered: false });
          console.log('Fallback insertMany completed for leave notifications.');
        } catch (err) {
          console.error('Fallback insertMany failed:', err?.message || err);
        }
      }
    } else {
      console.log('No recipients found for notifications');
    }
    response.created(res, 'Leave request submitted', leave);
  } catch (error) {
    console.error('Error creating leave request:', error);
    next(error);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await leaveService.getMyLeaves(req.user.organization, req.user.id);
    response.success(res, 'Leave requests retrieved', leaves);
  } catch (error) {
    next(error);
  }
};

const getPendingLeaves = async (req, res, next) => {
  try {
    const leaves = await leaveService.getPendingLeaves(req.user.organization);
    response.success(res, 'Pending leave requests retrieved', leaves);
  } catch (error) {
    next(error);
  }
};

const listLeaves = async (req, res, next) => {
  try {
    const filters = req.validatedQuery || req.query;
    const leaves = await leaveService.listLeaves(req.user.organization, filters);
    response.success(res, 'Leave requests retrieved', leaves);
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const leave = await leaveService.approveLeave(req.user.organization, req.params.id, req.user.id, payload?.note);
    const approvePayload = {
      user: leave.staff,
      organization: req.user.organization,
      title: 'Leave request approved',
      message: 'Your leave request was approved by your manager.',
      type: 'leave_approved',
      entityType: 'LeaveRequest',
      entityId: leave._id,
      link: '/leave-center',
      dedupeKey: `leave-approved-${leave._id}-${leave.staff}`
    };
    const approveNote = await notificationService.createNotification(approvePayload, { force: true });
    if (!approveNote) {
      await Notification.create(approvePayload);
    }
    await sendLeaveDecisionEmail(req.user.organization, leave.staff, 'approved');
    response.success(res, 'Leave approved', leave);
  } catch (error) {
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const leave = await leaveService.rejectLeave(req.user.organization, req.params.id, req.user.id, payload?.note);
    const rejectPayload = {
      user: leave.staff,
      organization: req.user.organization,
      title: 'Leave request rejected',
      message: 'Your leave request was rejected by your manager.',
      type: 'leave_rejected',
      entityType: 'LeaveRequest',
      entityId: leave._id,
      link: '/leave-center',
      dedupeKey: `leave-rejected-${leave._id}-${leave.staff}`
    };
    const rejectNote = await notificationService.createNotification(rejectPayload, { force: true });
    if (!rejectNote) {
      await Notification.create(rejectPayload);
    }
    await sendLeaveDecisionEmail(req.user.organization, leave.staff, 'rejected');
    response.success(res, 'Leave rejected', leave);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaves,
  getPendingLeaves,
  listLeaves,
  approveLeave,
  rejectLeave
};
