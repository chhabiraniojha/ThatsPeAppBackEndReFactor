const  sequelize  = require("../../../util/db_connect");

const {
  Wallet,
} = require("../../../models/WalletModels/WalletSchema/wallet");

const {
  WalletTransaction,
} = require(
  "../../../models/WalletModels/Wallet Transaction/walletTransaction"
);

const {
  Referral,
} = require("../../../models/ReferralModel/Referral");

const uidgenerate = require("../../../util/uidGenerator");

const processReferralReward = async ({
  order,
}) => {
  let transaction = null;

  try {
    /*
     * ==================================================
     * 1. BASIC VALIDATION
     * ==================================================
     */

    if (!order) {
      const error = new Error(
        "Order is required-from processReferralReward"
      );

      error.message =
        "Order is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_ORDER_REQUIRED";

      throw error;
    }

    if (!order.id) {
      const error = new Error(
        "Order ID is required-from processReferralReward"
      );

      error.message =
        "Order ID is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_ORDER_ID_REQUIRED";

      throw error;
    }

    if (!order.userId) {
      const error = new Error(
        "Order userId is required-from processReferralReward"
      );

      error.message =
        "Order userId is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_ORDER_USER_ID_REQUIRED";

      throw error;
    }

    /*
     * ==================================================
     * 2. ORDER AMOUNT VALIDATION
     * ==================================================
     *
     * Referral eligibility:
     *
     * order.amount >= minimumRechargeAmount
     *
     * couponDiscount ka yahan koi role nahi hai.
     */

    const orderAmount =
      Number(order.amount);

    if (
      !Number.isFinite(orderAmount) ||
      orderAmount <= 0
    ) {
      const error = new Error(
        "Valid order amount is required-from processReferralReward"
      );

      error.message =
        "Valid order amount is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_INVALID_ORDER_AMOUNT";

      throw error;
    }

    /*
     * ==================================================
     * 3. START DATABASE TRANSACTION
     * ==================================================
     */

    transaction =
      await sequelize.transaction();

    /*
     * ==================================================
     * 4. FIND REFERRAL
     * ==================================================
     *
     * Referral is identified using:
     *
     * referredUserId = order.userId
     *
     * Row lock is important so that two simultaneous
     * requests cannot process the same referral reward.
     */

    const referral =
      await Referral.findOne({
        where: {
          referredUserId:
            order.userId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    /*
     * ==================================================
     * 5. NO REFERRAL
     * ==================================================
     */

    if (!referral) {
      await transaction.commit();

      transaction = null;

      return {
        success: true,
        processed: false,
        eligible: false,
        reason: "NO_REFERRAL",
      };
    }

    /*
     * ==================================================
     * 6. ALREADY SUCCESSFUL
     * ==================================================
     */

    if (
      referral.rewardStatus ===
      "SUCCESS"
    ) {
      await transaction.commit();

      transaction = null;

      return {
        success: true,
        processed: false,
        eligible: true,
        alreadyRewarded: true,
        reason:
          "REWARD_ALREADY_PROCESSED",
        referralId:
          referral.id,
        rewardWalletTransactionId:
          referral.rewardWalletTransactionId ||
          null,
      };
    }

    /*
     * ==================================================
     * 7. ONLY PENDING CAN BE PROCESSED
     * ==================================================
     */

    if (
      referral.rewardStatus !==
      "PENDING"
    ) {
      await transaction.commit();

      transaction = null;

      return {
        success: true,
        processed: false,
        eligible: false,
        reason:
          "REWARD_NOT_PENDING",
        referralId:
          referral.id,
        rewardStatus:
          referral.rewardStatus,
      };
    }

    /*
     * ==================================================
     * 8. REFERRER VALIDATION
     * ==================================================
     *
     * Reward referrerUserId ko milega.
     */

    if (!referral.referrerUserId) {
      const error = new Error(
        "Referrer user ID is required-from processReferralReward"
      );

      error.message =
        "Referrer user ID is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_REFERRER_USER_ID_REQUIRED";

      throw error;
    }

    /*
     * ==================================================
     * 9. MINIMUM RECHARGE AMOUNT
     * ==================================================
     *
     * Final rule:
     *
     * order.amount >= referral.minimumRechargeAmount
     *
     * couponDiscount is NOT considered.
     */

    const minimumRechargeAmount =
      Number(
        referral.minimumRechargeAmount
      );

    if (
      !Number.isFinite(
        minimumRechargeAmount
      ) ||
      minimumRechargeAmount <= 0
    ) {
      const error = new Error(
        "Valid minimum recharge amount is required-from processReferralReward"
      );

      error.message =
        "Valid minimum recharge amount is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_INVALID_MINIMUM_RECHARGE_AMOUNT";

      throw error;
    }

    /*
     * ==================================================
     * 10. CHECK RECHARGE ELIGIBILITY
     * ==================================================
     */

    if (
      orderAmount <
      minimumRechargeAmount
    ) {
      await transaction.commit();

      transaction = null;

      return {
        success: true,
        processed: false,
        eligible: false,
        reason:
          "MINIMUM_RECHARGE_AMOUNT_NOT_MET",
        referralId:
          referral.id,
        orderAmount,
        minimumRechargeAmount,
      };
    }

    /*
     * ==================================================
     * 11. REWARD AMOUNT VALIDATION
     * ==================================================
     */

    const rewardAmount =
      Number(
        referral.rewardAmount
      );

    if (
      !Number.isFinite(
        rewardAmount
      ) ||
      rewardAmount <= 0
    ) {
      const error = new Error(
        "Valid referral reward amount is required-from processReferralReward"
      );

      error.message =
        "Valid referral reward amount is required-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_INVALID_REWARD_AMOUNT";

      throw error;
    }

    /*
     * ==================================================
     * 12. FIND REFERRER WALLET
     * ==================================================
     *
     * Reward referrer ke wallet me credit hoga.
     *
     * Wallet row ko lock kar rahe hain taaki
     * concurrent wallet updates safe rahen.
     */

    const wallet =
      await Wallet.findOne({
        where: {
          userId:
            referral.referrerUserId,
        },

        transaction,

        lock:
          transaction.LOCK.UPDATE,
      });

    if (!wallet) {
      const error = new Error(
        "Referrer wallet not found-from processReferralReward"
      );

      error.message =
        "Referrer wallet not found-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_REFERRER_WALLET_NOT_FOUND";

      throw error;
    }

    /*
     * ==================================================
     * 13. WALLET BALANCE
     * ==================================================
     */

    const startingBalance =
      Number(wallet.balance);

    if (
      !Number.isFinite(
        startingBalance
      )
    ) {
      const error = new Error(
        "Invalid referrer wallet balance-from processReferralReward"
      );

      error.message =
        "Invalid referrer wallet balance-from processReferralReward";

      error.debugMessage =
        "error from processReferralReward.js";

      error.code =
        "REFERRAL_INVALID_WALLET_BALANCE";

      throw error;
    }

    /*
     * ==================================================
     * 14. CALCULATE NEW BALANCE
     * ==================================================
     */

    const endingBalance =
      startingBalance +
      rewardAmount;

    /*
     * ==================================================
     * 15. UPDATE WALLET
     * ==================================================
     */

    await wallet.update(
      {
        balance:
          endingBalance,
      },
      {
        transaction,
      }
    );

    /*
     * ==================================================
     * 16. CREATE WALLET TRANSACTION
     * ==================================================
     *
     * Reward credit ka proper ledger entry.
     */

    const walletTransaction =
      await WalletTransaction.create(
        {
          id:
            uidgenerate(),

          walletId:
            wallet.id,

          amount:
            rewardAmount,

          startingBalance:
            startingBalance,

          endingBalance:
            endingBalance,

          transactionType:
            "REWARD",

          balanceType:
            "CREDIT",

          orderId:
            order.id,

          status:
            "SUCCESS",

          failureReason:
            null,
        },
        {
          transaction,
        }
      );

    /*
     * ==================================================
     * 17. UPDATE REFERRAL
     * ==================================================
     *
     * Wallet credit successfully ho gaya hai.
     *
     * Ab referral ko SUCCESS mark karenge.
     */

    referral.rewardStatus =
      "SUCCESS";

    referral.rewardWalletTransactionId =
      walletTransaction.id;

    referral.rewardedAt =
      new Date();

    await referral.save({
      transaction,
    });

    /*
     * ==================================================
     * 18. COMMIT
     * ==================================================
     *
     * Ye teen operations same transaction me hain:
     *
     * 1. Wallet balance update
     * 2. WalletTransaction create
     * 3. Referral SUCCESS
     *
     * Agar inme se koi bhi fail hota hai,
     * transaction rollback hoga.
     */

    await transaction.commit();

    transaction = null;

    /*
     * ==================================================
     * 19. SUCCESS RESPONSE
     * ==================================================
     */

    return {
      success: true,

      processed: true,

      eligible: true,

      referralId:
        referral.id,

      referrerUserId:
        referral.referrerUserId,

      rewardAmount,

      walletId:
        wallet.id,

      walletTransactionId:
        walletTransaction.id,

      startingBalance,

      endingBalance,

      rewardStatus:
        "SUCCESS",
    };

  } catch (error) {

    /*
     * ==================================================
     * 20. ROLLBACK
     * ==================================================
     */

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        error.rollbackError =
          rollbackError.message;
      }

      transaction = null;
    }

    /*
     * ==================================================
     * 21. MARK REFERRAL FAILED
     * ==================================================
     *
     * Main reward transaction rollback hone ke baad
     * Referral ko alag DB operation me FAILED karenge.
     *
     * Is operation ke fail hone par original error
     * preserve rahega.
     */

    try {
      if (order?.userId) {

        const referral =
          await Referral.findOne({
            where: {
              referredUserId:
                order.userId,
            },
          });

        if (
          referral &&
          referral.rewardStatus ===
          "PENDING"
        ) {
          referral.rewardStatus =
            "FAILED";

          await referral.save();
        }
      }

    } catch (referralStatusError) {

      /*
       * Original reward error ko replace nahi karna hai.
       */

      error.referralStatusUpdateError =
        referralStatusError.message;
    }

    /*
     * ==================================================
     * 22. DIRECT THROW SEQUELIZE / DATABASE ERROR
     * ==================================================
     *
     * Sequelize / DB error ko generic error me
     * wrap nahi karna hai.
     */

    if (
      error?.name?.startsWith(
        "Sequelize"
      )
    ) {
      throw error;
    }

    /*
     * ==================================================
     * 23. DIRECT THROW NETWORK ERROR
     * ==================================================
     */

    const networkErrorCodes = [
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EHOSTUNREACH",
      "ECONNABORTED",
    ];

    if (
      networkErrorCodes.includes(
        error?.code
      )
    ) {
      throw error;
    }

    /*
     * ==================================================
     * 24. PRESERVE STRUCTURED ERROR
     * ==================================================
     */

    if (
      error?.code &&
      error?.message &&
      error?.debugMessage
    ) {
      throw error;
    }

    /*
     * ==================================================
     * 25. UNKNOWN / UNSTRUCTURED ERROR
     * ==================================================
     */

    const structuredError =
      new Error(
        "Referral reward processing failed-from processReferralReward"
      );

    structuredError.message =
      "Referral reward processing failed-from processReferralReward";

    structuredError.debugMessage =
      "error from processReferralReward.js";

    structuredError.code =
      "REFERRAL_REWARD_PROCESSING_FAILED";

    structuredError.rawResponse = {
      originalError:
        error?.message || null,

      referralStatusUpdateError:
        error?.referralStatusUpdateError ||
        null,
    };

    throw structuredError;
  }
};

module.exports = {
  processReferralReward,
};