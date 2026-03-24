// Asset Controller
const assetService = require('../services/assetService');
const response = require('../utils/response');
const activityService = require('../services/activityService');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { ValidationError } = require('../utils/errorHandler');
const { uploadBuffer } = require('../services/cloudinaryService');

const parseCsv = (content = '') => {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      if (row.length || current.trim()) {
        row.push(current.trim());
        rows.push(row);
      }
      row = [];
      current = '';
      continue;
    }
    current += char;
  }
  if (row.length || current.trim()) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
};

const normalizeHeader = (value = '') => value.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
const numberOrUndefined = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const ensureOwnerInOrg = async (organizationId, ownerId) => {
  if (!ownerId) return;
  const owner = await User.findOne({ _id: ownerId, organization: organizationId, active: true }).select('_id');
  if (!owner) {
    throw new ValidationError('Asset owner must belong to your organization and be active');
  }
};

const normalizeAssetPayload = (data = {}) => {
  const payload = { ...data };

  if (payload.assetTag && !payload.assetNumber) payload.assetNumber = payload.assetTag;
  if (payload.assetNumber && !payload.assetTag) payload.assetTag = payload.assetNumber;
  if (payload.code && !payload.assetNumber) payload.assetNumber = payload.code;
  if (payload.assetNumber && !payload.code) payload.code = payload.assetNumber;
  if (payload.serial && !payload.serialNumber) payload.serialNumber = payload.serial;
  if (payload.serialNumber && !payload.serial) payload.serial = payload.serialNumber;
  if (payload.model && !payload.modelNumber) payload.modelNumber = payload.model;
  if (payload.modelNumber && !payload.model) payload.model = payload.modelNumber;
  if (payload.installDate && !payload.installationDate) payload.installationDate = payload.installDate;
  if (payload.installationDate && !payload.installDate) payload.installDate = payload.installationDate;

  if (payload.location && !payload.propertyLocation) payload.propertyLocation = payload.location;
  if (payload.propertyLocation && !payload.location) payload.location = payload.propertyLocation;
  if (payload.building && !payload.buildingLocation) payload.buildingLocation = payload.building;
  if (payload.buildingLocation && !payload.building) payload.building = payload.buildingLocation;

  if (typeof payload.specs === 'string') {
    const trimmed = payload.specs.trim();
    if (trimmed) payload.specs = { notes: trimmed };
  }

  if (Array.isArray(payload.maintenanceSchedule)) {
    const scheduleLastDates = payload.maintenanceSchedule
      .map((item) => item?.last)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((d) => !Number.isNaN(d.getTime()));
    const scheduleNextDates = payload.maintenanceSchedule
      .map((item) => item?.next)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((d) => !Number.isNaN(d.getTime()));
    const derivedLast = scheduleLastDates.length
      ? new Date(Math.max(...scheduleLastDates.map((d) => d.getTime())))
      : null;
    const derivedNext = scheduleNextDates.length
      ? new Date(Math.min(...scheduleNextDates.map((d) => d.getTime())))
      : null;

    if (!payload.lastMaintenance && !payload.lastMaintenanceDate && derivedLast) {
      payload.lastMaintenance = derivedLast;
      payload.lastMaintenanceDate = derivedLast;
    }
    if (!payload.nextService && !payload.nextMaintenanceDate && derivedNext) {
      payload.nextService = derivedNext;
      payload.nextMaintenanceDate = derivedNext;
    }
  }

  if (payload.lastMaintenanceDate && !payload.lastMaintenance) payload.lastMaintenance = payload.lastMaintenanceDate;
  if (payload.lastMaintenance && !payload.lastMaintenanceDate) payload.lastMaintenanceDate = payload.lastMaintenance;

  if (payload.nextMaintenanceDate && !payload.nextService) payload.nextService = payload.nextMaintenanceDate;
  if (payload.nextService && !payload.nextMaintenanceDate) payload.nextMaintenanceDate = payload.nextService;

  if (payload.imageUrl && !payload.imageUrls) payload.imageUrls = [payload.imageUrl];
  if (payload.imageUrls && !payload.imageUrl && payload.imageUrls[0]) payload.imageUrl = payload.imageUrls[0];

  if (typeof payload.imageUrl === 'string') {
    const trimmed = payload.imageUrl.trim();
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      delete payload.imageUrl;
    }
  }
  if (Array.isArray(payload.imageUrls)) {
    payload.imageUrls = payload.imageUrls.filter((url) => {
      if (typeof url !== 'string') return false;
      const trimmed = url.trim();
      return trimmed && !trimmed.startsWith('blob:') && !trimmed.startsWith('data:');
    });
    if (!payload.imageUrls.length) delete payload.imageUrls;
  }
  if (Array.isArray(payload.images)) {
    payload.images = payload.images.filter((url) => {
      if (typeof url !== 'string') return false;
      const trimmed = url.trim();
      return trimmed && !trimmed.startsWith('blob:') && !trimmed.startsWith('data:');
    });
    if (!payload.images.length) delete payload.images;
  }

  return payload;
};

const cleanImageFields = (assetDoc) => {
  if (!assetDoc) return assetDoc;
  const asset = typeof assetDoc.toObject === 'function' ? assetDoc.toObject() : { ...assetDoc };

  const isValidUrl = (url) => {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    return !!trimmed && !trimmed.startsWith('blob:') && !trimmed.startsWith('data:');
  };

  const imageUrls = Array.isArray(asset.imageUrls) ? asset.imageUrls.filter(isValidUrl) : [];
  const images = Array.isArray(asset.images) ? asset.images.filter(isValidUrl) : [];

  if (imageUrls.length) asset.imageUrls = imageUrls;
  if (images.length) asset.images = images;

  if (!isValidUrl(asset.imageUrl)) {
    const fallback = imageUrls[0] || images[0];
    if (fallback) asset.imageUrl = fallback;
  }

  return asset;
};

const getAssets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const filters = {};
    const organizationId = req.user.organization;
    
    if (status) filters.status = status;
    if (category) filters.category = category;

    let result;
    if (search) {
      result = await assetService.searchAssets(organizationId, search, parseInt(page), parseInt(limit));
    } else {
      result = await assetService.getAssets(organizationId, filters, parseInt(page), parseInt(limit));
    }

    if (Array.isArray(result?.assets)) {
      result.assets = result.assets.map(cleanImageFields);
    }
    response.success(res, 'Assets retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.user.organization, req.params.id);
    response.success(res, 'Asset retrieved successfully', cleanImageFields(asset));
  } catch (error) {
    next(error);
  }
};

const getAssetHistory = async (req, res, next) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, organization: req.user.organization })
      .select('statusHistory')
      .populate('statusHistory.changedBy', 'name email');
    if (!asset) {
      throw new ValidationError('Asset not found');
    }
    const history = Array.isArray(asset.statusHistory) ? asset.statusHistory : [];
    const sorted = history
      .slice()
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    response.success(res, 'Asset history retrieved successfully', sorted);
  } catch (error) {
    next(error);
  }
};

const getAssetByCode = async (req, res, next) => {
  try {
    const code = String(req.query.code || '').trim();
    if (!code) {
      throw new ValidationError('Asset code is required');
    }
    const asset = await assetService.getAssetByCode(req.user.organization, code);
    response.success(res, 'Asset retrieved successfully', cleanImageFields(asset));
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const assetData = normalizeAssetPayload(req.body);
    assetData.organization = req.user.organization;
    assetData.changedBy = req.user.id;
    await ensureOwnerInOrg(req.user.organization, assetData.owner);
    if (req.file) {
      assetData.imageUrl = req.file.path;
      assetData.imageUrls = [req.file.path];
      assetData.images = [req.file.path];
    }
    const asset = await assetService.createAsset(req.user.organization, assetData);
    activityService.broadcast({
      type: 'asset_created',
      message: `${asset.name || 'Asset'} created`,
      entityType: 'Asset',
      entityId: asset._id,
      link: `/assets/${asset._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.created(res, 'Asset created successfully', asset);
  } catch (error) {
    next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const updateData = normalizeAssetPayload(req.body);
    await ensureOwnerInOrg(req.user.organization, updateData.owner);
    if (req.file) {
      updateData.imageUrl = req.file.path;
      updateData.imageUrls = [req.file.path];
      updateData.images = [req.file.path];
    }
    const asset = await assetService.updateAsset(req.user.organization, req.params.id, updateData, req.user.id);
    activityService.broadcast({
      type: 'asset_updated',
      message: `${asset.name || 'Asset'} updated`,
      entityType: 'Asset',
      entityId: asset._id,
      link: `/assets/${asset._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Asset updated successfully', asset);
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const deleted = await assetService.deleteAsset(req.user.organization, req.params.id);
    activityService.broadcast({
      type: 'asset_deleted',
      message: `${deleted.name || 'Asset'} deleted`,
      entityType: 'Asset',
      entityId: deleted._id,
      link: `/assets/${deleted._id}`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Asset deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

const importAssets = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      throw new ValidationError('CSV file is required');
    }
    if (!['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'].includes(req.file.mimetype)) {
      throw new ValidationError('Only CSV files are supported for import');
    }
    const content = req.file.buffer.toString('utf8');
    const rows = parseCsv(content);
    if (!rows.length) {
      throw new ValidationError('CSV file is empty');
    }
    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map(normalizeHeader);
    const map = (row) => {
      const data = {};
      headers.forEach((key, idx) => {
        data[key] = row[idx];
      });
      return {
        name: data.name || data.assetname || data.title,
        assetNumber: data.assetnumber || data.code || data.assetcode,
        description: data.description,
        category: data.category,
        location: data.location,
        serialNumber: data.serialnumber || data.serial,
        manufacturer: data.manufacturer,
        modelNumber: data.modelnumber || data.model,
        purchaseDate: data.purchasedate || data.purchase,
        purchasePrice: numberOrUndefined(data.purchaseprice || data.price),
        status: data.status,
        qrCode: data.qrcode,
        department: data.department
      };
    };
    const assets = dataRows.map(map);

    await uploadBuffer(req.file, {
      folder: 'facilitypro/asset-imports',
      resourceType: 'raw'
    });

    const result = await assetService.importAssets(req.user.organization, assets);
    response.success(res, 'Assets imported successfully', result);
  } catch (error) {
    next(error);
  }
};

const downloadImportTemplate = async (req, res) => {
  const header = [
    'name',
    'assetNumber',
    'category',
    'location',
    'status',
    'serialNumber',
    'manufacturer',
    'modelNumber',
    'purchaseDate',
    'purchasePrice',
    'qrCode',
    'department',
    'description'
  ];
  const sample = [
    'Example Asset',
    'AS-1001',
    'HVAC',
    'Building A',
    'active',
    'SN-ABC-123',
    'Carrier',
    'X100',
    '2024-01-15',
    '1200',
    'QR-1001',
    'Facilities',
    'Routine maintenance item'
  ];
  const csv = `${header.join(',')}\n${sample.join(',')}\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="assets-import-template.csv"');
  return res.status(200).send(csv);
};
const bulkUpdateAssetStatus = async (req, res, next) => {
  try {
    const { ids = [], status } = req.body;
    const result = await assetService.bulkUpdateAssetStatus(req.user.organization, ids, status, req.user.id);
    activityService.broadcast({
      type: 'asset_bulk_status',
      message: `Updated ${result.updatedCount} assets to ${status}`,
      entityType: 'Asset',
      link: `/assets`,
      createdAt: new Date().toISOString(),
      organization: req.user.organization,
      user: req.user.email
    });
    response.success(res, 'Asset status updated successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetById,
  getAssetHistory,
  getAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset,
  downloadImportTemplate,
  importAssets,
  bulkUpdateAssetStatus
};
