// Expense Model
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    vendor: {
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
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    attachments: [String]
  },
  { timestamps: true }
);

expenseSchema.index({ organization: 1, status: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
