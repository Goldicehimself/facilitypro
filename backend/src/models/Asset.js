// Asset Model
const mongoose = require('mongoose');
const constants = require('../constants/constants');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  shortDescription: String,
  assetNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  assetTag: {
    type: String,
    sparse: true,
    trim: true
  },
  code: {
    type: String,
    sparse: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  propertyLocation: {
    type: String,
    trim: true
  },
  buildingLocation: {
    type: String,
    trim: true
  },
  building: {
    type: String,
    trim: true
  },
  floor: {
    type: String,
    trim: true
  },
  room: {
    type: String,
    trim: true
  },
  serviceArea: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  serial: {
    type: String,
    sparse: true,
    trim: true
  },
  manufacturer: String,
  modelNumber: String,
  model: String,
  installationDate: Date,
  installDate: Date,
  specs: mongoose.Schema.Types.Mixed,
  purchaseDate: Date,
  purchasePrice: Number,
  depreciationRate: Number,
  warranty: {
    expires: Date,
    provider: String,
    purchaseDate: Date
  },
  status: {
    type: String,
    enum: Object.values(constants.ASSET_STATUS),
    default: constants.ASSET_STATUS.ACTIVE
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  images: [String],
  imageUrl: String,
  imageUrls: [String],
  qrCode: String,
  notes: String,
  maintenanceHistory: [{
    date: Date,
    description: String,
    technician: mongoose.Schema.Types.ObjectId,
    cost: Number
  }],
  maintenanceSchedule: [mongoose.Schema.Types.Mixed],
  parts: [mongoose.Schema.Types.Mixed],
  documents: [mongoose.Schema.Types.Mixed],
  performanceMetrics: mongoose.Schema.Types.Mixed,
  warrantyStatus: String,
  maintenanceStatus: String,
  lastMaintenance: Date,
  lastMaintenanceDate: Date,
  maintenanceFrequency: String,
  maintenanceProvider: String,
  nextService: Date,
  nextMaintenanceDate: Date,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  department: String,
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for frequently searched fields
assetSchema.index({ name: 'text', description: 'text', assetNumber: 1 });
assetSchema.index({ status: 1, category: 1 });
assetSchema.index({ organization: 1, assetNumber: 1 }, { unique: true, sparse: true });
assetSchema.index({ organization: 1, serialNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Asset', assetSchema);
