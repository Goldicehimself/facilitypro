// Activity Model
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    type: String,
    action: String,
    title: String,
    description: String,
    user: String,
    status: String,
    entityType: String,
    entityId: mongoose.Schema.Types.Mixed,
    link: String
  },
  { timestamps: true }
);

activitySchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
