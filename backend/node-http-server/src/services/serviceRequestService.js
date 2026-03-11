// Service Request Service
const ServiceRequest = require('../models/ServiceRequest');
const { NotFoundError } = require('../utils/errorHandler');

const getServiceRequests = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };

  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    scopedFilters.$or = [{ title: regex }, { description: regex }];
    delete scopedFilters.search;
  }

  const query = ServiceRequest.find(scopedFilters)
    .populate('requester assignee asset')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const [requests, total] = await Promise.all([
    query.exec(),
    ServiceRequest.countDocuments(scopedFilters)
  ]);

  const summaryFilters = { ...scopedFilters };
  if (summaryFilters.status) {
    delete summaryFilters.status;
  }
  const summaryAggregation = await ServiceRequest.aggregate([
    { $match: summaryFilters },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const summary = summaryAggregation.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    requests,
    summary,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getServiceRequestSummary = async (organizationId) => {
  const summaryAggregation = await ServiceRequest.aggregate([
    { $match: { organization: organizationId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const summary = summaryAggregation.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
  const total = await ServiceRequest.countDocuments({ organization: organizationId });
  return { summary, total };
};

const getServiceRequestById = async (organizationId, id) => {
  const request = await ServiceRequest.findOne({ _id: id, organization: organizationId })
    .populate('requester assignee asset');
  if (!request) {
    throw new NotFoundError('ServiceRequest');
  }
  return request;
};

const createServiceRequest = async (organizationId, requesterId, requestData) => {
  requestData.organization = organizationId;
  requestData.requester = requesterId;
  const request = new ServiceRequest(requestData);
  await request.save();
  await request.populate('requester assignee asset');
  return request;
};

const updateServiceRequest = async (organizationId, id, updateData) => {
  updateData.updatedAt = new Date();
  if (updateData.status === 'completed') {
    updateData.completedAt = new Date();
  }
  const request = await ServiceRequest.findOneAndUpdate(
    { _id: id, organization: organizationId },
    updateData,
    { new: true, runValidators: true }
  ).populate('requester assignee asset');
  if (!request) {
    throw new NotFoundError('ServiceRequest');
  }
  return request;
};

const assignServiceRequest = async (organizationId, id, assigneeId, note = '') => {
  const updateData = {
    assignee: assigneeId,
    assignmentNote: note || undefined,
    status: 'assigned',
    assignedAt: new Date(),
    updatedAt: new Date()
  };
  return updateServiceRequest(organizationId, id, updateData);
};

const updateServiceRequestStatus = async (organizationId, id, status) => {
  const updateData = { status, updatedAt: new Date() };
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  return updateServiceRequest(organizationId, id, updateData);
};

const deleteServiceRequest = async (organizationId, id) => {
  const request = await ServiceRequest.findOneAndDelete({ _id: id, organization: organizationId });
  if (!request) {
    throw new NotFoundError('ServiceRequest');
  }
  return request;
};

module.exports = {
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest,
  assignServiceRequest,
  updateServiceRequestStatus,
  deleteServiceRequest,
  getServiceRequestSummary
};
