const sequelize = require("../../../util/db_connect");
const { Op } = require("sequelize");

const Wallet = require("../../../models/WalletModels/WalletSchema/wallet");
const WalletTransaction = require("../../../models/WalletModels/Wallet Transaction/walletTransaction");
const Order = require("../../../models/OrderModel/order");
const uidgenerate = require("../../../util/uidGenerator");

const refundWallet = async ({
  order,
}) => {
  /*
   * --------------------------------------------------
   * 1. Basic Validation
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage = "error from refundWallet.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");

    error.message = "OrderId is required";
    error.debugMessage = "error from refundWallet.js";
    error.code = "ORDER_ID_REQUIRED";

    throw error;
  }

  if (!order.userId) {
    const error = new Error("Order user ID is required");

    error.message = "Order user ID is required";
    error.debugMessage = "error from refundWallet.js";
    error.code = "ORDER_USER_ID_REQUIRED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 2. Refund Amount
   * --------------------------------------------------
   *
   * Wallet se actual debit hua tha order.walletAmount.
   *
   * Isliye refund bhi wahi amount hoga.
   *
   * UPI-only order:
   * walletAmount = 0
   *
   * WALLET:
   * walletAmount = full amount
   *
   * COMBO:
   * walletAmount = wallet portion
   */

  const refundAmount = Number(
    order.walletAmount
  );

  if (
    !Number.isFinite(refundAmount) ||
    refundAmount < 0
  ) {
    const error = new Error(
      "Invalid wallet refund amount"
    );

    error.message = "Invalid wallet refund amount";
    error.debugMessage = "error from refundWallet.js";
    error.code = "INVALID_WALLET_REFUND_AMOUNT";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 3. Nothing To Refund
   * --------------------------------------------------
   */

  if (refundAmount === 0) {
    return {
      success: true,

      orderId: order.id,

      refunded: false,

      alreadyRefunded: false,

      refundAmount: 0,

      walletTransactionId: null,

      message:
        "No wallet amount is available for refund",
    };
  }

  /*
   * --------------------------------------------------
   * 4. Start Short DB Transaction
   * --------------------------------------------------
   *
   * Vendor API yahan call nahi hoga.
   *
   * Sirf wallet + refund transaction DB operation
   * ek transaction ke andar hoga.
   */

  const transaction =
    await sequelize.transaction();

  try {
    /*
     * ------------------------------------------------
     * 5. Get Wallet
     * ------------------------------------------------
     *
     * Row lock use kar rahe hain.
     */

    const wallet = await Wallet.findOne({
      where: {
        userId: order.userId,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    if (!wallet) {
      const error = new Error(
        "Wallet not found for user"
      );

      error.message = "Wallet not found for user";
      error.debugMessage = "error from refundWallet.js";
      error.code = "WALLET_NOT_FOUND";

      throw error;
    }

    /*
     * ------------------------------------------------
     * 6. Check Existing Refund
     * ------------------------------------------------
     *
     * Same order ke liye already successful
     * REFUND transaction hai ya nahi.
     *
     * Ye idempotency ka important part hai.
     */

    const existingRefund =
      await WalletTransaction.findOne({
        where: {
          orderId: order.id,

          transactionType: "REFUND",

          balanceType: "CREDIT",

          status: "SUCCESS",
        },

        transaction,

        lock: transaction.LOCK.UPDATE,
      });

    if (existingRefund) {
      await transaction.commit();

      return {
        success: true,

        orderId: order.id,

        refunded: true,

        alreadyRefunded: true,

        refundAmount: Number(
          existingRefund.amount
        ),

        walletTransactionId:
          existingRefund.id,

        message:
          "Wallet refund already processed",
      };
    }

    /*
     * ------------------------------------------------
     * 7. Starting Balance
     * ------------------------------------------------
     */

    const startingBalance = Number(
      wallet.balance
    );

    /*
     * ------------------------------------------------
     * 8. Calculate Ending Balance
     * ------------------------------------------------
     */

    const endingBalance =
      startingBalance + refundAmount;

    /*
     * ------------------------------------------------
     * 9. Credit Wallet
     * ------------------------------------------------
     */

    await wallet.update(
      {
        balance: endingBalance,
      },
      {
        transaction,
      }
    );

    /*
     * ------------------------------------------------
     * 10. Create Refund Wallet Transaction
     * ------------------------------------------------
     */

    const walletTransaction =
      await WalletTransaction.create(
        {
          id: await uidgenerate(),

          walletId: wallet.id,

          amount: refundAmount,

          startingBalance,

          endingBalance,

          transactionType: "REFUND",

          balanceType: "CREDIT",

          orderId: order.id,

          status: "SUCCESS",

          failureReason: null,
        },
        {
          transaction,
        }
      );

    /*
     * ------------------------------------------------
     * 11. Commit
     * ------------------------------------------------
     */

    await transaction.commit();

    /*
     * ------------------------------------------------
     * 12. Return
     * ------------------------------------------------
     */

    return {
      success: true,

      orderId: order.id,

      refunded: true,

      alreadyRefunded: false,

      refundAmount,

      walletTransactionId:
        walletTransaction.id,

      startingBalance,

      endingBalance,

      status: "SUCCESS",
    };

  } catch (error) {
    /*
     * ------------------------------------------------
     * Rollback
     * ------------------------------------------------
     */

    await transaction.rollback();

    throw error;
  }
};

module.exports = {
  refundWallet,
};