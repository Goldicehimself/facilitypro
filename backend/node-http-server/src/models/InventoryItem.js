// Inventory Item Model
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  partNumber: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: 0
  },
  unitCost: {
    type: Number,
    default: 0,
    min: 0
  },
  usage30d: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
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

inventoryItemSchema.index({ item: 'text', partNumber: 'text' });
inventoryItemSchema.index({ status: 1, category: 1 });
inventoryItemSchema.index({ organization: 1, partNumber: 1 }, { sparse: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
