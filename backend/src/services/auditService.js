// Audit Service
const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
  organization,
  actor,
  action,
  entityType = null,
  entityId = null,
  metadata = {}
}) => {
  if (!organization || !actor || !action) return null;
  return AuditLog.create({
    organization,
    actor,
    action,
    entityType,
    entityId,
    metadata
  });
};

module.exports = {
  createAuditLog
};
