// Vendor Model
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  contactPerson: String,
  email: {
    type: String,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  category: {
    type: String,
    trim: true
  },
  services: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  specialties: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  monthlySpend: {
    type: Number,
    min: 0,
    default: 0
  },
  contractStartDate: Date,
  contractEndDate: Date,
  lastServiceDate: Date,
  website: String,
  active: {
    type: Boolean,
    default: true
  },
  notes: String,
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

module.exports = mongoose.model('Vendor', vendorSchema);
