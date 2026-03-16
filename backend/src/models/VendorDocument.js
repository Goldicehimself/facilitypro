// Vendor Document Model
const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: String,
      trim: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

vendorDocumentSchema.index({ organization: 1, vendor: 1, uploadedAt: -1 });

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);
