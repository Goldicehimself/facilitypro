// Leave Service
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { NotFoundError, BadRequestError } = require('../utils/errorHandler');
const { sendEmail } = require('../utils/email');
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

const createLeaveRequest = async (organizationId, staffId, payload) => {
  const staff = await User.findOne({ _id: staffId, organization: organizationId, active: true });
  if (!staff) {
    throw new BadRequestError('Staff user not found or inactive');
  }

  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  if (start > end) {
    throw new BadRequestError('Start date must be before end date');
  }

  const leave = new LeaveRequest({
    organization: organizationId,
    staff: staffId,
    type: payload.type,
    startDate: start,
    endDate: end,
    reason: payload.reason
  });

  await leave.save();
  return leave;
};

const getMyLeaves = async (organizationId, staffId) => {
  return LeaveRequest.find({ organization: organizationId, staff: staffId })
    .sort({ createdAt: -1 })
    .populate('approvedBy rejectedBy', 'firstName lastName email');
};

const getPendingLeaves = async (organizationId) => {
  return LeaveRequest.find({ organization: organizationId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('staff', 'firstName lastName email');
};

const approveLeave = async (organizationId, leaveId, approverId, note) => {
  const leave = await LeaveRequest.findOne({ _id: leaveId, organization: organizationId });
  if (!leave) throw new NotFoundError('Leave request');
  if (leave.status !== 'pending') throw new BadRequestError('Leave already processed');

  leave.status = 'approved';
  leave.approvedBy = approverId;
  leave.approvedAt = new Date();
  if (note) leave.managerNote = note;

  await leave.save();
  return leave;
};

const rejectLeave = async (organizationId, leaveId, approverId, note) => {
  const leave = await LeaveRequest.findOne({ _id: leaveId, organization: organizationId });
  if (!leave) throw new NotFoundError('Leave request');
  if (leave.status !== 'pending') throw new BadRequestError('Leave already processed');

  leave.status = 'rejected';
  leave.rejectedBy = approverId;
  leave.rejectedAt = new Date();
  if (note) leave.managerNote = note;

  await leave.save();
  return leave;
};

const sendLeaveReminderEmails = async () => {
  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const orgCache = new Map();

  const getOrgMeta = async (orgId) => {
    const id = String(orgId || '');
    if (!id) return null;
    if (orgCache.has(id)) return orgCache.get(id);
    const org = await Organization.findById(id)
      .select('name orgCode settings.companyProfile.supportEmail')
      .lean();
    orgCache.set(id, org || null);
    return org || null;
  };

  const endingSoonLeaves = await LeaveRequest.find({
    status: 'approved',
    endDate: { $gte: now, $lte: soonThreshold },
    $or: [{ 'reminders.endingSoonSentAt': { $exists: false } }, { 'reminders.endingSoonSentAt': null }]
  }).populate('staff', 'email firstName lastName active');

  for (const leave of endingSoonLeaves) {
    if (!leave.staff?.email || leave.staff.active === false) continue;
    const org = await getOrgMeta(leave.organization);
    const endDateText = leave.endDate.toDateString();
    const html = renderTemplate('facilitypro-transactional.html', {
      preheader_text: `Your leave ends on ${endDateText}.`,
      header_badge: 'Leave Reminder',
      headline: 'Leave ending soon',
      recipient_name: getRecipientName(leave.staff),
      body_copy: `Your ${leave.type || ''} leave is scheduled to end on ${endDateText}.`,
      action_url: `${frontendBaseUrl}/leave-center`,
      action_label: 'View leave',
      org_name: org?.name || 'FacilityPro',
      org_code: org?.orgCode || '',
      requester_name: leave.staff?.email || '',
      request_time: now.toLocaleString(),
      support_email: getSupportEmail(org),
      footer_note: 'If you have questions, contact your manager.',
      year: new Date().getFullYear()
    });
    await sendEmail({
      to: leave.staff.email,
      subject: 'Leave ending soon',
      text: `Hello ${leave.staff.firstName || ''}, your leave ends on ${leave.endDate.toDateString()}.`,
      html: html || undefined
    });
    leave.reminders = { ...(leave.reminders || {}), endingSoonSentAt: new Date() };
    await leave.save();
  }

  const endedLeaves = await LeaveRequest.find({
    status: 'approved',
    endDate: { $lt: now },
    $or: [{ 'reminders.endedSentAt': { $exists: false } }, { 'reminders.endedSentAt': null }]
  }).populate('staff', 'email firstName lastName active');

  for (const leave of endedLeaves) {
    if (!leave.staff?.email || leave.staff.active === false) continue;
    const org = await getOrgMeta(leave.organization);
    const endDateText = leave.endDate.toDateString();
    const html = renderTemplate('facilitypro-transactional.html', {
      preheader_text: `Your leave ended on ${endDateText}.`,
      header_badge: 'Leave Update',
      headline: 'Leave ended',
      recipient_name: getRecipientName(leave.staff),
      body_copy: `Your ${leave.type || ''} leave ended on ${endDateText}.`,
      action_url: `${frontendBaseUrl}/leave-center`,
      action_label: 'View leave history',
      org_name: org?.name || 'FacilityPro',
      org_code: org?.orgCode || '',
      requester_name: leave.staff?.email || '',
      request_time: now.toLocaleString(),
      support_email: getSupportEmail(org),
      footer_note: 'If you have questions, contact your manager.',
      year: new Date().getFullYear()
    });
    await sendEmail({
      to: leave.staff.email,
      subject: 'Leave ended',
      text: `Hello ${leave.staff.firstName || ''}, your leave has ended on ${leave.endDate.toDateString()}.`,
      html: html || undefined
    });
    leave.reminders = { ...(leave.reminders || {}), endedSentAt: new Date() };
    await leave.save();
  }
};

const listLeaves = async (organizationId, filters = {}) => {
  const query = { organization: organizationId };
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.staff) query.staff = filters.staff;
  if (filters.from || filters.to) {
    query.startDate = {};
    if (filters.from) query.startDate.$gte = new Date(filters.from);
    if (filters.to) query.startDate.$lte = new Date(filters.to);
  }

  return LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('staff', 'firstName lastName email')
    .populate('approvedBy rejectedBy', 'firstName lastName email');
};

module.exports = {
  createLeaveRequest,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  sendLeaveReminderEmails,
  listLeaves
};
