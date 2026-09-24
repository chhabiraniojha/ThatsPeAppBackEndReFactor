const Referral = require("../../models/ReferralModel/Referral");

const calculateReferralDiscount = async ({
  userId,
  amountAfterOperatorDiscount,
}) => {
  const amount = Number(amountAfterOperatorDiscount);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error(
      "Invalid amount after operator discount"
    );

    error.code = "INVALID_DISCOUNTED_BASE_AMOUNT";

    throw error;
  }

  const referral = await Referral.findOne({
    where: {
      referredUserId: userId,
    },
  });

  // User referral se nahi aaya
  if (!referral) {
    return {
      referralApplied: false,
      referralId: null,
      referralDiscount: 0,
      discountedAmount: Number(amount.toFixed(2)),
    };
  }

  const referralDiscount = Number(
    referral.couponDiscount || 0
  );

  if (
    !Number.isFinite(referralDiscount) ||
    referralDiscount < 0
  ) {
    const error = new Error(
      "Invalid referral discount"
    );

    error.code = "INVALID_REFERRAL_DISCOUNT";

    throw error;
  }

  // Referral discount remaining amount se
  // zyada nahi ho sakta
  const appliedReferralDiscount = Math.min(
    referralDiscount,
    amount
  );

  const discountedAmount = Number(
    (
      amount - appliedReferralDiscount
    ).toFixed(2)
  );

  return {
    referralApplied:
      appliedReferralDiscount > 0,

    referralId: referral.id,

    referralDiscount:
      Number(appliedReferralDiscount.toFixed(2)),

    discountedAmount,
  };
};

module.exports = {
  calculateReferralDiscount,
};