const Vendor = require('../models/Vendor');

const normalizeRange = (rangeDays) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - rangeDays + 1);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - rangeDays + 1);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd };
};

const percentChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
};

const getActiveContractsCount = (vendors, periodStart, periodEnd) => {
  return vendors.filter((vendor) => {
    const start = vendor.contractStartDate ? new Date(vendor.contractStartDate) : null;
    const end = vendor.contractEndDate ? new Date(vendor.contractEndDate) : null;

    if (start || end) {
      const startsBeforeEnd = !start || start <= periodEnd;
      const endsAfterStart = !end || end >= periodStart;
      return startsBeforeEnd && endsAfterStart;
    }

    return vendor.status === 'active';
  }).length;
};

const getAverageRating = (vendors) => {
  const ratings = vendors.map((vendor) => vendor.rating).filter((rating) => Number.isFinite(rating));
  if (!ratings.length) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return total / ratings.length;
};

const getMonthlySpendTotal = (vendors) => {
  return vendors.reduce((sum, vendor) => sum + (Number(vendor.monthlySpend) || 0), 0);
};

const getAnalytics = async (organizationId, rangeDays) => {
  const { start, end, prevStart, prevEnd } = normalizeRange(rangeDays);

  const [currentVendors, previousVendors] = await Promise.all([
    Vendor.find({ organization: organizationId, createdAt: { $lte: end } })
      .select('rating monthlySpend contractStartDate contractEndDate status')
      .lean(),
    Vendor.find({ organization: organizationId, createdAt: { $lte: prevEnd } })
      .select('rating monthlySpend contractStartDate contractEndDate status')
      .lean()
  ]);

  const totalVendors = currentVendors.length;
  const totalVendorsPrev = previousVendors.length;

  const activeContracts = getActiveContractsCount(currentVendors, start, end);
  const activeContractsPrev = getActiveContractsCount(previousVendors, prevStart, prevEnd);

  const averageRating = getAverageRating(currentVendors);
  const averageRatingPrev = getAverageRating(previousVendors);

  const monthlySpend = getMonthlySpendTotal(currentVendors);
  const monthlySpendPrev = getMonthlySpendTotal(previousVendors);

  return {
    summary: {
      totalVendors,
      totalVendorsTrend: percentChange(totalVendors, totalVendorsPrev),
      activeContracts,
      activeContractsTrend: percentChange(activeContracts, activeContractsPrev),
      averageRating: Number(averageRating.toFixed(1)),
      averageRatingTrend: percentChange(averageRating, averageRatingPrev),
      monthlySpend: Number(monthlySpend.toFixed(2)),
      monthlySpendTrend: percentChange(monthlySpend, monthlySpendPrev)
    }
  };
};

module.exports = {
  getAnalytics
};
