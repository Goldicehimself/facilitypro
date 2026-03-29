// User Model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../constants/constants');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  emailVerifiedAt: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, default: null },
  emailVerificationExpiresAt: { type: Date, default: null },
  phone: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: Object.values(constants.ROLES),
    default: constants.ROLES.USER
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  avatarPublicId: {
    type: String,
    default: null
  },
  department: {
    type: String,
    trim: true
  },
  certificates: [mongoose.Schema.Types.Mixed],
  active: {
    type: Boolean,
    default: true
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  passwordResetRequired: {
    type: Boolean,
    default: false
  },
  mfaCodeHash: {
    type: String,
    default: null
  },
  mfaCodeExpiresAt: {
    type: Date,
    default: null
  },
  mfaCodeSentAt: {
    type: Date,
    default: null
  },
  lastLogin: Date,
  performanceScore: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  completedOrders: {
    type: Number,
    default: 0
  },
  assignedOrders: {
    type: Number,
    default: 0
  },
  certificationsCount: {
    type: Number,
    default: 0
  },
  avgCompletionHours: {
    type: Number,
    default: 0
  },
  onTimeCompletionRate: {
    type: Number,
    default: 0
  },
  preferences: {
    emailNotifications: { type: Boolean, default: false },
    inAppNotifications: { type: Boolean, default: true }
  },
  lastActive: Date,
  resetPasswordTokenHash: {
    type: String,
    default: null
  },
  resetPasswordExpiresAt: {
    type: Date,
    default: null
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

userSchema.index({ email: 1, organization: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
