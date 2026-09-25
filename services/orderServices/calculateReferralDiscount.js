const { Op } = require("sequelize");

const Referral = require("../../models/ReferralModel/Referral");
const Order = require("../../models/OrderModel/order");

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

  /*
   * ==================================================
   * 1. USER IS NOT REFERRED
   * ==================================================
   */

  if (!referral) {
    return {
      referralApplied: false,
      referralId: null,
      referralDiscount: 0,
      discountedAmount: Number(
        amount.toFixed(2)
      ),
    };
  }

  /*
   * ==================================================
   * 2. REFERRAL REWARD ALREADY PROCESSED / FAILED
   * ==================================================
   *
   * SUCCESS:
   * Referral reward already processed.
   *
   * FAILED:
   * Referral reward processing already failed.
   *
   * Dono cases me referral discount dobara
   * apply nahi hoga.
   */

  if (
    referral.rewardStatus === "SUCCESS" ||
    referral.rewardStatus === "FAILED"
  ) {
    return {
      referralApplied: false,

      referralId:
        referral.id,

      referralDiscount: 0,

      discountedAmount:
        Number(amount.toFixed(2)),
    };
  }

  /*
   * ==================================================
   * 3. CHECK EXISTING REFERRAL DISCOUNT ORDER
   * ==================================================
   *
   * Agar user ke kisi existing order me:
   *
   * referralDiscount > 0
   *
   * aur status:
   *
   * PROCESSING / PENDING / SUCCESS
   *
   * hai, to referral discount dobara apply nahi hoga.
   */

  const existingReferralOrder =
    await Order.findOne({
      where: {
        userId,

        referralDiscount: {
          [Op.gt]: 0,
        },

        status: {
          [Op.in]: [
            "PROCESSING",
            "PENDING",
            "SUCCESS",
          ],
        },
      },

      order: [
        ["createdAt", "DESC"],
      ],
    });

  if (existingReferralOrder) {
    return {
      referralApplied: false,

      referralId:
        referral.id,

      referralDiscount: 0,

      discountedAmount:
        Number(amount.toFixed(2)),
    };
  }

  /*
   * ==================================================
   * 4. REFERRAL DISCOUNT
   * ==================================================
   */

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

    error.code =
      "INVALID_REFERRAL_DISCOUNT";

    throw error;
  }

  /*
   * ==================================================
   * 5. APPLY REFERRAL DISCOUNT
   * ==================================================
   *
   * Referral discount remaining amount se
   * zyada nahi ho sakta.
   */

  const appliedReferralDiscount =
    Math.min(
      referralDiscount,
      amount
    );

  const discountedAmount = Number(
    (
      amount -
      appliedReferralDiscount
    ).toFixed(2)
  );

  /*
   * ==================================================
   * 6. RESPONSE
   * ==================================================
   */

  return {
    referralApplied:
      appliedReferralDiscount > 0,

    referralId:
      referral.id,

    referralDiscount:
      Number(
        appliedReferralDiscount.toFixed(2)
      ),

    discountedAmount,
  };
};

module.exports = {
  calculateReferralDiscount,
};