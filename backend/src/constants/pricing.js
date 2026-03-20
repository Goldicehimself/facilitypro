const ANNUAL_DISCOUNT = 0.2;

const PRICING_PLANS = {
  starter: {
    monthly: 19000,
    seatsIncluded: 5,
    extraSeatPrice: 4000,
  },
  pro: {
    monthly: 39000,
    seatsIncluded: 10,
    extraSeatPrice: 4000,
  },
  enterprise: {
    monthly: 0,
    seatsIncluded: 0,
    extraSeatPrice: 0,
  },
};

module.exports = {
  ANNUAL_DISCOUNT,
  PRICING_PLANS,
};
