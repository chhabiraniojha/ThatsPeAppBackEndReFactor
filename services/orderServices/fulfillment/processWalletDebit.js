const sequelize = require("../../../util/db_connect");
const { Op } = require("sequelize");

const Wallet = require("../../../models/WalletModels/WalletSchema/wallet");

const WalletTransaction = require(
  "../../../models/WalletModels/Wallet Transaction/walletTransaction"
);

const Order = require("../../../models/OrderModel/order");

const TransactionHistory = require(
  "../../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions"
);

const uidgenerate = require("../../../util/uidGenerator");


const processWalletDebit = async (order) => {
  /*
   * --------------------------------------------------
   * 1. BASIC ORDER VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");
    error.code = "ORDER_REQUIRED";
    error.message="Order is required";
    error.debugMessage="error from processWalletDebit.js";
    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");
    error.message =
      "OrderId is required";
    error.code = "ORDER_ID_REQUIRED";
    error.debugMessage="error from processWalletDebit.js"
    throw error;
  }

  if (!order.userId) {
    const error = new Error("User ID is required");
    error.code = "USER_ID_REQUIRED";
    error.message="User ID is required";
    error.debugMessage="error from processWalletDebit.js";
    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. PAYMENT METHOD VALIDATION
   * --------------------------------------------------
   */

  const paymentMethod = order.paymentMethod;

  if (!["UPI", "WALLET", "COMBO"].includes(paymentMethod)) {
    const error = new Error("Invalid payment method");
    error.code = "INVALID_PAYMENT_METHOD";
    error.message="nvalid payment method";
    error.debugMessage="error from processWalletDebit.js";
    throw error;
  }


  /*
   * --------------------------------------------------
   * 3. WALLET AMOUNT VALIDATION
   * --------------------------------------------------
   */

  const walletAmount = Number(order.walletAmount);

  if (
    !Number.isFinite(walletAmount) ||
    walletAmount < 0
  ) {
    const error = new Error("Invalid wallet amount");
    error.code = "INVALID_WALLET_AMOUNT";
    error.message="Invalid wallet amount";
    error.debugMessage="error from processWalletDebit.js";
    throw error;
  }


  /*
   * --------------------------------------------------
   * 4. START DATABASE TRANSACTION
   * --------------------------------------------------
   *
   * This transaction covers:
   *
   * 1. Order status update
   * 2. TransactionHistory status update
   * 3. Wallet debit
   * 4. WalletTransaction creation
   *
   * Vendor API call will NOT happen inside this
   * transaction.
   */

  const transaction = await sequelize.transaction();

  try {

    /*
     * --------------------------------------------------
     * 5. ATOMIC ORDER STATUS CHANGE
     * --------------------------------------------------
     *
     * CREATED -> PROCESSING
     *
     * This protects against duplicate fulfillment calls.
     *
     * Request A:
     * CREATED -> PROCESSING  ✅
     *
     * Request B:
     * CREATED -> PROCESSING  ❌
     */

    const [orderUpdated] = await Order.update(
      {
        status: "PROCESSING",
      },
      {
        where: {
          id: order.id,
          status: "CREATED",
        },
        transaction,
      }
    );

    if (orderUpdated !== 1) {
      const error = new Error(
        "Order is no longer available for fulfillment"
      );

      error.code = "ORDER_ALREADY_PROCESSED";
      error.message="Order is no longer available for fulfillment";
      error.debugMessage="error from processWalletDebit.js";

      throw error;
    }


    /*
     * --------------------------------------------------
     * 6. TRANSACTION HISTORY STATUS CHANGE
     * --------------------------------------------------
     *
     * CREATED -> PROCESSING
     *
     * Order aur TransactionHistory ka status
     * synchronized rakha ja raha hai.
     *
     * Agar ye update fail hua to complete DB
     * transaction rollback hoga.
     */

    const [historyUpdated] =
      await TransactionHistory.update(
        {
          status: "PROCESSING",
        },
        {
          where: {
            orderId: order.id,
            status: "CREATED",
          },
          transaction,
        }
      );

    if (historyUpdated !== 1) {
      const error = new Error(
        "Transaction history is no longer available for processing"
      );

      error.code =
        "TRANSACTION_HISTORY_ALREADY_PROCESSED";
      error.message="Transaction history is no longer available for processing";
      error.debugMessage="error from processWalletDebit.js";  

      throw error;
    }


    /*
     * --------------------------------------------------
     * 7. UPI PAYMENT
     * --------------------------------------------------
     *
     * UPI payment does not require wallet debit.
     *
     * At this point:
     *
     * Order:
     * CREATED -> PROCESSING
     *
     * TransactionHistory:
     * CREATED -> PROCESSING
     */

    if (paymentMethod === "UPI") {
      await transaction.commit();

      return {
        orderId: order.id,

        paymentMethod,

        walletDebited: false,

        walletAmount: 0,

        walletTransactionId: null,

        status: "PROCESSING",
      };
    }


    /*
     * --------------------------------------------------
     * 8. WALLET / COMBO WALLET AMOUNT VALIDATION
     * --------------------------------------------------
     *
     * WALLET and COMBO both require wallet debit.
     */

    if (walletAmount <= 0) {
      const error = new Error(
        "Wallet amount must be greater than zero"
      );

      error.code = "INVALID_WALLET_DEBIT_AMOUNT";
      error.message="Wallet amount must be greater than zero";
      error.debugMessage="error from processWalletDebit.js";

      throw error;
    }


    /*
     * --------------------------------------------------
     * 9. GET ACTIVE WALLET
     * --------------------------------------------------
     *
     * Row lock prevents concurrent wallet operations
     * from modifying the same wallet simultaneously.
     */

    const wallet = await Wallet.findOne({
      where: {
        userId: order.userId,
        status: "active",
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

    if (!wallet) {
      const error = new Error(
        "Active wallet not found"
      );

      error.code = "WALLET_NOT_FOUND";
      error.message="Active wallet not found";
      error.debugMessage="error from processWalletDebit.js";

      throw error;
    }


    /*
     * --------------------------------------------------
     * 10. STARTING BALANCE
     * --------------------------------------------------
     */

    const startingBalance = Number(
      wallet.balance
    );

    if (
      !Number.isFinite(startingBalance) ||
      startingBalance < 0
    ) {
      const error = new Error(
        "Invalid wallet balance"
      );

      error.code = "INVALID_WALLET_BALANCE";
      error.message="Invalid wallet balance";
      error.debugMessage="error from processWalletDebit.js";

      throw error;
    }


    /*
     * --------------------------------------------------
     * 11. ATOMIC WALLET DEBIT
     * --------------------------------------------------
     *
     * Debit is performed only when:
     *
     * wallet is active
     * AND
     * wallet balance >= required amount
     */

    const [walletUpdated] =
      await Wallet.update(
        {
          balance: sequelize.literal(
            `balance - ${walletAmount.toFixed(2)}`
          ),
        },
        {
          where: {
            id: wallet.id,

            status: "active",

            balance: {
              [Op.gte]: walletAmount,
            },
          },

          transaction,
        }
      );

    if (walletUpdated !== 1) {
      const error = new Error(
        "Insufficient wallet balance"
      );

      error.code =
        "INSUFFICIENT_WALLET_BALANCE";
      error.message="Insufficient wallet balance";
      error.debugMessage="error from processWalletDebit.js";  

      throw error;
    }


    /*
     * --------------------------------------------------
     * 12. ENDING BALANCE
     * --------------------------------------------------
     */

    const endingBalance = Number(
      (
        startingBalance -
        walletAmount
      ).toFixed(2)
    );


    /*
     * --------------------------------------------------
     * 13. CREATE WALLET TRANSACTION
     * --------------------------------------------------
     *
     * Records the actual wallet debit.
     */

    const walletTransaction =
      await WalletTransaction.create(
        {
          id: await uidgenerate(),

          walletId: wallet.id,

          amount: walletAmount,

          startingBalance,

          endingBalance,

          transactionType: "RECHARGE",

          balanceType: "DEBIT",

          orderId: order.id,

          status: "SUCCESS",

          failureReason: null,
        },
        {
          transaction,
        }
      );


    /*
     * --------------------------------------------------
     * 14. COMMIT DATABASE TRANSACTION
     * --------------------------------------------------
     *
     * At this point:
     *
     * Order:
     * CREATED -> PROCESSING
     *
     * TransactionHistory:
     * CREATED -> PROCESSING
     *
     * Wallet:
     * balance decreased
     *
     * WalletTransaction:
     * created successfully
     */

    await transaction.commit();


    /*
     * --------------------------------------------------
     * 15. RETURN RESULT
     * --------------------------------------------------
     */

    return {
      orderId: order.id,

      paymentMethod,

      walletDebited: true,

      walletId: wallet.id,

      walletAmount,

      startingBalance,

      endingBalance,

      walletTransactionId:
        walletTransaction.id,

      status: "PROCESSING",
    };

  } catch (error) {

    /*
     * --------------------------------------------------
     * 16. ROLLBACK
     * --------------------------------------------------
     *
     * If anything fails before commit:
     *
     * Order status
     * TransactionHistory status
     * Wallet debit
     * WalletTransaction
     *
     * will all be rolled back together.
     */

    await transaction.rollback();

    throw error;
  }
};


module.exports = {
  processWalletDebit,
};