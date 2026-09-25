const sequelize = require("../../../util/db_connect");

const Wallet = require("../../../models/WalletModels/WalletSchema/wallet");
const WalletTransaction = require("../../../models/WalletModels/Wallet Transaction/walletTransaction");
const uidgenerate = require("../../../util/uidGenerator");

const refundWallet = async ({
  order,
}) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
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
   * 2. REFUND AMOUNT
   * --------------------------------------------------
   *
   * Order failure hone par user ne jitna total
   * amount pay kiya tha, wahi pura amount wallet
   * me refund hoga.
   *
   * UPI:
   * finalPayableAmount = online paid amount
   *
   * WALLET:
   * finalPayableAmount = wallet paid amount
   *
   * COMBO:
   * finalPayableAmount =
   * wallet amount + online paid amount
   *
   * Isliye refund ke liye finalPayableAmount
   * ko source of truth maana jayega.
   */

  const refundAmount = Number(
    order.finalPayableAmount
  );

  if (
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0
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
   * 3. START DATABASE TRANSACTION
   * --------------------------------------------------
   *
   * Wallet balance aur refund transaction
   * ek hi DB transaction ke andar honge.
   *
   * Agar koi operation fail hota hai,
   * pura transaction rollback hoga.
   */

  const transaction =
    await sequelize.transaction();

  try {
    /*
     * ------------------------------------------------
     * 4. GET USER WALLET
     * ------------------------------------------------
     *
     * UPDATE lock use kar rahe hain taaki
     * same wallet par concurrent refund/debit
     * safely handle ho sake.
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
     * 5. CHECK EXISTING REFUND
     * ------------------------------------------------
     *
     * Same order ke liye agar pehle hi successful
     * refund ho chuka hai to dobara refund nahi karna.
     *
     * Ye idempotency protection hai.
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
     * 6. STARTING BALANCE
     * ------------------------------------------------
     */

    const startingBalance = Number(
      wallet.balance
    );

    /*
     * ------------------------------------------------
     * 7. CALCULATE ENDING BALANCE
     * ------------------------------------------------
     */

    const endingBalance =
      startingBalance + refundAmount;

    /*
     * ------------------------------------------------
     * 8. CREDIT WALLET
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
     * 9. CREATE REFUND WALLET TRANSACTION
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
     * 10. COMMIT TRANSACTION
     * ------------------------------------------------
     */

    await transaction.commit();

    /*
     * ------------------------------------------------
     * 11. RETURN SUCCESS
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
     * 12. ROLLBACK
     * ------------------------------------------------
     */

    await transaction.rollback();

    throw error;
  }
};

module.exports = {
  refundWallet,
};