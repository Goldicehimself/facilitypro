// Vendor Document Service
const VendorDocument = require('../models/VendorDocument');
const Vendor = require('../models/Vendor');
const { NotFoundError } = require('../utils/errorHandler');

const ensureVendorInOrg = async (organizationId, vendorId) => {
  const vendor = await Vendor.findOne({ _id: vendorId, organization: organizationId }).select('_id');
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }
};

const listVendorDocuments = async (organizationId, vendorId, filters = {}, page = 1, limit = 20) => {
  await ensureVendorInOrg(organizationId, vendorId);
  const skip = (page - 1) * limit;
  const scopedFilters = { organization: organizationId, vendor: vendorId };

  if (filters.type) scopedFilters.type = filters.type;
  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    scopedFilters.$or = [{ name: regex }, { type: regex }];
  }

  const query = VendorDocument.find(scopedFilters)
    .populate('uploadedBy')
    .skip(skip)
    .limit(limit)
    .sort({ uploadedAt: -1 });

  const [documents, total] = await Promise.all([
    query.exec(),
    VendorDocument.countDocuments(scopedFilters)
  ]);

  return {
    documents,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const createVendorDocument = async (organizationId, vendorId, userId, data) => {
  await ensureVendorInOrg(organizationId, vendorId);
  const payload = {
    ...data,
    vendor: vendorId,
    organization: organizationId,
    uploadedBy: userId
  };
  const document = new VendorDocument(payload);
  await document.save();
  await document.populate('uploadedBy');
  return document;
};

const updateVendorDocument = async (organizationId, vendorId, documentId, data) => {
  await ensureVendorInOrg(organizationId, vendorId);
  const document = await VendorDocument.findOneAndUpdate(
    { _id: documentId, organization: organizationId, vendor: vendorId },
    data,
    { new: true, runValidators: true }
  ).populate('uploadedBy');
  if (!document) {
    throw new NotFoundError('VendorDocument');
  }
  return document;
};

const deleteVendorDocument = async (organizationId, vendorId, documentId) => {
  await ensureVendorInOrg(organizationId, vendorId);
  const document = await VendorDocument.findOneAndDelete({
    _id: documentId,
    organization: organizationId,
    vendor: vendorId
  });
  if (!document) {
    throw new NotFoundError('VendorDocument');
  }
  return document;
};

module.exports = {
  listVendorDocuments,
  createVendorDocument,
  updateVendorDocument,
  deleteVendorDocument
};
