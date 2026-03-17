// Work Order Model
const mongoose = require('mongoose');
const constants = require('../constants/constants');

const workOrderSchema = new mongoose.Schema({
  workOrderNumber: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Asset is required']
  },
  status: {
    type: String,
    enum: Object.values(constants.WORK_ORDER_STATUS),
    default: constants.WORK_ORDER_STATUS.OPEN
  },
  priority: {
    type: String,
    enum: Object.values(constants.PRIORITY),
    default: constants.PRIORITY.MEDIUM
  },
  maintenanceType: {
    type: String,
    enum: Object.values(constants.MAINTENANCE_TYPE),
    default: constants.MAINTENANCE_TYPE.CORRECTIVE
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: Date,
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completionDate: Date,
  overdueNotifiedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  progress: {
    type: Number,
    default: 0
  },
  estimatedCost: Number,
  actualCost: Number,
  notes: String,
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replacedParts: [{
    name: String,
    quantity: Number,
    cost: Number,
    originalCost: Number
  }],
  extraCosts: [{
    description: String,
    amount: Number,
    date: Date,
    receipt: String
  }],
  issues: [{
    title: String,
    description: String,
    severity: String,
    category: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [String],
  photos: [String],
  tags: [String],
  location: String,
  parts: [{
    name: String,
    qty: Number
  }],
  requiresCertification: {
    type: Boolean,
    default: false
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

// Index for common searches
workOrderSchema.index({ status: 1, priority: 1 });
workOrderSchema.index({ assignedTo: 1 });
workOrderSchema.index({ asset: 1 });
workOrderSchema.index({ createdAt: -1 });
workOrderSchema.index({ organization: 1, workOrderNumber: 1 }, { unique: true });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
