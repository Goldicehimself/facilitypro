// Service Request Model
const mongoose = require('mongoose');
const constants = require('../constants/constants');

const serviceRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: Object.values(constants.PRIORITY),
    default: constants.PRIORITY.MEDIUM
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed'],
    default: 'pending'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  assignmentNote: String,
  assignedAt: Date,
  completedAt: Date,
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

serviceRequestSchema.index({ status: 1, priority: 1 });
serviceRequestSchema.index({ requester: 1, assignee: 1 });
serviceRequestSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
