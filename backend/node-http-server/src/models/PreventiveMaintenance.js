// Preventive Maintenance Model
const mongoose = require('mongoose');
const constants = require('../constants/constants');

const preventiveMaintenanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Asset is required']
  },
  description: String,
  frequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'],
    required: [true, 'Frequency is required']
  },
  priority: {
    type: String,
    enum: Object.values(constants.PRIORITY),
    default: constants.PRIORITY.MEDIUM
  },
  lastPerformed: Date,
  nextDueDate: {
    type: Date,
    required: [true, 'Next due date is required']
  },
  dueNotifiedAt: Date,
  estimatedCost: Number,
  estimatedHours: Number,
  procedures: [String],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  active: {
    type: Boolean,
    default: true
  },
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

// Index for upcoming maintenance
preventiveMaintenanceSchema.index({ nextDueDate: 1, active: 1 });
preventiveMaintenanceSchema.index({ asset: 1 });

module.exports = mongoose.model('PreventiveMaintenance', preventiveMaintenanceSchema);
