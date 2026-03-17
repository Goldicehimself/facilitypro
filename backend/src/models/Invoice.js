// Invoice Model
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    workOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder'
    },
    clientName: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ organization: 1, status: 1, issueDate: -1 });
invoiceSchema.index({ organization: 1, vendor: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
