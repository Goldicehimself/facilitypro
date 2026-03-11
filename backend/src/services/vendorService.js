// Vendor Service
const Vendor = require('../models/Vendor');
const { NotFoundError } = require('../utils/errorHandler');

const getVendors = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };
  
  const query = Vendor.find(scopedFilters)
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });

  const [vendors, total] = await Promise.all([
    query.exec(),
    Vendor.countDocuments(scopedFilters)
  ]);

  return {
    vendors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getVendorById = async (organizationId, id) => {
  const vendor = await Vendor.findOne({ _id: id, organization: organizationId });
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }
  return vendor;
};

const createVendor = async (organizationId, vendorData) => {
  vendorData.organization = organizationId;
  const vendor = new Vendor(vendorData);
  await vendor.save();
  return vendor;
};

const updateVendor = async (organizationId, id, updateData) => {
  const vendor = await Vendor.findOneAndUpdate({ _id: id, organization: organizationId }, updateData, {
    new: true,
    runValidators: true
  });
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }
  return vendor;
};

const deleteVendor = async (organizationId, id) => {
  const vendor = await Vendor.findOneAndDelete({ _id: id, organization: organizationId });
  if (!vendor) {
    throw new NotFoundError('Vendor');
  }
  return vendor;
};

const importVendors = async (organizationId, vendors = []) => {
  const valid = [];
  const errors = [];

  vendors.forEach((v, idx) => {
    const row = idx + 1;
    if (!v?.name) {
      errors.push(`Row ${row}: Vendor name is required`);
      return;
    }
    if (!v?.email) {
      errors.push(`Row ${row}: Email is required`);
      return;
    }
    valid.push({
      name: v.name,
      email: v.email,
      phone: v.phone,
      category: v.category,
      address: v.address,
      city: v.city,
      state: v.state,
      zipCode: v.zipCode,
      contactPerson: v.contactPerson,
      rating: typeof v.rating === 'number' ? v.rating : undefined,
      notes: v.notes,
      organization: organizationId
    });
  });

  if (!valid.length) {
    return { successful: 0, failed: errors.length, errors };
  }

  try {
    const inserted = await Vendor.insertMany(valid, { ordered: false });
    const successful = inserted.length;
    const failed = Math.max(0, valid.length - successful) + errors.length;
    return { successful, failed, errors };
  } catch (err) {
    const insertedCount = err?.result?.insertedCount || 0;
    const writeErrors = err?.writeErrors || [];
    const errorMessages = writeErrors.map((e) => e.errmsg || e.message || 'Insert error');
    return {
      successful: insertedCount,
      failed: (valid.length - insertedCount) + errors.length,
      errors: [...errors, ...errorMessages]
    };
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  importVendors
};
