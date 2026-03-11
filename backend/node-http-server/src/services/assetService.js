// Asset Service
const Asset = require('../models/Asset');
const { NotFoundError } = require('../utils/errorHandler');

const getAssets = async (organizationId, filters = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const scopedFilters = { ...filters, organization: organizationId };
  
  const query = Asset.find(scopedFilters)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const [assets, total] = await Promise.all([
    query.exec(),
    Asset.countDocuments(scopedFilters)
  ]);

  return {
    assets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getAssetById = async (organizationId, id) => {
  const asset = await Asset.findOne({ _id: id, organization: organizationId }).populate('owner');
  if (!asset) {
    throw new NotFoundError('Asset');
  }
  return asset;
};

const getAssetByCode = async (organizationId, code) => {
  const trimmed = String(code || '').trim();
  const asset = await Asset.findOne({
    organization: organizationId,
    $or: [
      { assetNumber: trimmed },
      { serialNumber: trimmed },
      { qrCode: trimmed }
    ]
  }).populate('owner');
  if (!asset) {
    throw new NotFoundError('Asset');
  }
  return asset;
};

const createAsset = async (organizationId, assetData) => {
  assetData.organization = organizationId;
  const asset = new Asset(assetData);
  await asset.save();
  return asset;
};

const updateAsset = async (organizationId, id, updateData) => {
  const asset = await Asset.findOneAndUpdate({ _id: id, organization: organizationId }, updateData, {
    new: true,
    runValidators: true
  });
  if (!asset) {
    throw new NotFoundError('Asset');
  }
  return asset;
};

const deleteAsset = async (organizationId, id) => {
  const asset = await Asset.findOneAndDelete({ _id: id, organization: organizationId });
  if (!asset) {
    throw new NotFoundError('Asset');
  }
  return asset;
};

const bulkUpdateAssetStatus = async (organizationId, ids = [], status) => {
  const scopedFilters = { organization: organizationId };
  if (Array.isArray(ids) && ids.length > 0) {
    scopedFilters._id = { $in: ids };
  }

  const result = await Asset.updateMany(scopedFilters, {
    status,
    updatedAt: new Date()
  });
  const updatedAssets = await Asset.find(scopedFilters);

  return {
    updatedCount: result.modifiedCount ?? result.nModified ?? 0,
    updatedIds: updatedAssets.map((asset) => asset._id),
    assets: updatedAssets
  };
};

const searchAssets = async (organizationId, query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const assets = await Asset.find(
    { $text: { $search: query }, organization: organizationId },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);

  const total = await Asset.countDocuments({ $text: { $search: query }, organization: organizationId });

  return {
    assets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const importAssets = async (organizationId, assets = []) => {
  const valid = [];
  const errors = [];

  assets.forEach((asset, idx) => {
    const row = idx + 1;
    if (!asset?.name) {
      errors.push(`Row ${row}: Asset name is required`);
      return;
    }
    valid.push({
      name: asset.name,
      assetNumber: asset.assetNumber,
      description: asset.description,
      category: asset.category,
      location: asset.location,
      serialNumber: asset.serialNumber,
      manufacturer: asset.manufacturer,
      modelNumber: asset.modelNumber,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
      status: asset.status,
      qrCode: asset.qrCode,
      department: asset.department,
      organization: organizationId
    });
  });

  if (!valid.length) {
    return { successful: 0, failed: errors.length, errors };
  }

  try {
    const inserted = await Asset.insertMany(valid, { ordered: false });
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
  getAssets,
  getAssetById,
  getAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset,
  searchAssets,
  bulkUpdateAssetStatus,
  importAssets
};
