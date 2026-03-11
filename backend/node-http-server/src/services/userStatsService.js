// User Stats Service
const User = require('../models/User');
const WorkOrder = require('../models/WorkOrder');
const { countApprovedCertificates } = require('../utils/certificateUtils');

const computeWorkOrderStats = async (organizationId, userId) => {
  const [assignedOrders, completedOrders, agg] = await Promise.all([
    WorkOrder.countDocuments({ organization: organizationId, assignedTo: userId }),
    WorkOrder.countDocuments({ organization: organizationId, assignedTo: userId, status: 'completed' }),
    WorkOrder.aggregate([
      {
        $match: {
          organization: organizationId,
          assignedTo: userId,
          status: 'completed',
          completionDate: { $ne: null },
          dueDate: { $ne: null }
        }
      },
      {
        $addFields: {
          startBase: { $ifNull: ['$startDate', '$createdAt'] },
          durationHours: {
            $divide: [{ $subtract: ['$completionDate', { $ifNull: ['$startDate', '$createdAt'] }] }, 3600000]
          },
          onTime: { $cond: [{ $lte: ['$completionDate', '$dueDate'] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: null,
          avgDurationHours: { $avg: '$durationHours' },
          completedWithDates: { $sum: 1 },
          onTimeCount: { $sum: '$onTime' }
        }
      }
    ])
  ]);

  const performanceScore = assignedOrders
    ? Math.round((completedOrders / assignedOrders) * 100)
    : 0;
  const rating = Math.round((performanceScore / 100) * 50) / 10;
  const statsRow = agg?.[0] || {};
  const avgCompletionHours = statsRow.avgDurationHours
    ? Math.round(statsRow.avgDurationHours * 10) / 10
    : 0;
  const onTimeCompletionRate = statsRow.completedWithDates
    ? Math.round((statsRow.onTimeCount / statsRow.completedWithDates) * 100)
    : 0;

  return {
    assignedOrders,
    completedOrders,
    performanceScore,
    rating,
    avgCompletionHours,
    onTimeCompletionRate
  };
};

const refreshUserStats = async ({ organizationId, userId }) => {
  if (!organizationId || !userId) return null;
  const stats = await computeWorkOrderStats(organizationId, userId);
  const user = await User.findOne({ _id: userId, organization: organizationId }).select('certificates lastLogin updatedAt createdAt');
  if (!user) return null;
  const certificationsCount = countApprovedCertificates(user.certificates);
  const lastActive = user.lastLogin || user.updatedAt || user.createdAt;
  const updates = {
    performanceScore: stats.performanceScore,
    rating: stats.rating,
    completedOrders: stats.completedOrders,
    assignedOrders: stats.assignedOrders,
    avgCompletionHours: stats.avgCompletionHours,
    onTimeCompletionRate: stats.onTimeCompletionRate,
    certificationsCount,
    lastActive
  };
  await User.updateOne({ _id: userId }, { $set: updates });
  return updates;
};

const refreshUsersStats = async ({ organizationId, userIds = [] }) => {
  const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
  if (!uniqueIds.length) return [];
  const results = [];
  for (const id of uniqueIds) {
    const updated = await refreshUserStats({ organizationId, userId: id });
    if (updated) results.push({ userId: id, ...updated });
  }
  return results;
};

module.exports = {
  refreshUserStats,
  refreshUsersStats
};
