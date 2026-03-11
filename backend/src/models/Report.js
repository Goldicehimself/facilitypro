// Report Model
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['asset', 'maintenance', 'work-order', 'financial', 'custom'],
    required: true
  },
  description: String,
  generatedBy: {
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
  filters: mongoose.Schema.Types.Mixed,
  startDate: Date,
  endDate: Date,
  data: mongoose.Schema.Types.Mixed,
  format: {
    type: String,
    enum: ['pdf', 'excel', 'json', 'csv'],
    default: 'json'
  },
  filePath: String,
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

module.exports = mongoose.model('Report', reportSchema);
