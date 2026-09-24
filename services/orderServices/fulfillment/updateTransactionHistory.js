const TransactionHistory = require(
  "../../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions"
);

const updateTransactionHistory = async ({
  order,
  status,
}) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage =
      "error from updateTransactionHistory.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");

    error.message = "OrderId is required";
    error.debugMessage =
      "error from updateTransactionHistory.js";
    error.code = "ORDER_ID_REQUIRED";

    throw error;
  }

  if (!status) {
    const error = new Error(
      "Transaction history status is required"
    );

    error.message =
      "Transaction history status is required";

    error.debugMessage =
      "error from updateTransactionHistory.js";

    error.code =
      "TRANSACTION_HISTORY_STATUS_REQUIRED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. NORMALIZE STATUS
   * --------------------------------------------------
   */

  const transactionStatus =
    String(status).toUpperCase();

  const allowedStatuses = [
    "CREATED",
    "PROCESSING",
    "PENDING",
    "SUCCESS",
    "FAILED",
  ];

  if (!allowedStatuses.includes(transactionStatus)) {
    const error = new Error(
      `Invalid transaction history status: ${status}`
    );

    error.message =
      `Invalid transaction history status: ${status}`;

    error.debugMessage =
      "error from updateTransactionHistory.js";

    error.code =
      "INVALID_TRANSACTION_HISTORY_STATUS";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 3. FIND TRANSACTION HISTORY
   * --------------------------------------------------
   */

  const transactionHistory =
    await TransactionHistory.findOne({
      where: {
        orderId: order.id,
      },
    });

  if (!transactionHistory) {
    const error = new Error(
      "Transaction history not found for order"
    );

    error.message =
      "Transaction history not found for order";

    error.debugMessage =
      "error from updateTransactionHistory.js";

    error.code =
      "TRANSACTION_HISTORY_NOT_FOUND";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 4. CURRENT STATUS
   * --------------------------------------------------
   */

  const currentStatus =
    transactionHistory.status;


  /*
   * --------------------------------------------------
   * 5. FINAL STATUS PROTECTION
   * --------------------------------------------------
   *
   * SUCCESS is final.
   *
   * Once SUCCESS is reached, no later status should
   * overwrite it.
   */

  if (currentStatus === "SUCCESS") {
    return {
      success: true,

      orderId: order.id,

      transactionHistoryId:
        transactionHistory.id,

      previousStatus: currentStatus,

      status: currentStatus,

      alreadyUpdated: true,
    };
  }


  /*
   * --------------------------------------------------
   * 6. FAILED STATUS PROTECTION
   * --------------------------------------------------
   *
   * FAILED is final.
   *
   * Once FAILED is reached, do not move it back to
   * PROCESSING, PENDING, or SUCCESS.
   */

  if (
    currentStatus === "FAILED" &&
    transactionStatus !== "FAILED"
  ) {
    return {
      success: true,

      orderId: order.id,

      transactionHistoryId:
        transactionHistory.id,

      previousStatus: currentStatus,

      status: currentStatus,

      alreadyUpdated: true,
    };
  }


  /*
   * --------------------------------------------------
   * 7. NO-OP FOR SAME STATUS
   * --------------------------------------------------
   */

  if (currentStatus === transactionStatus) {
    return {
      success: true,

      orderId: order.id,

      transactionHistoryId:
        transactionHistory.id,

      previousStatus: currentStatus,

      status: currentStatus,

      alreadyUpdated: true,
    };
  }


  /*
   * --------------------------------------------------
   * 8. VALIDATE STATUS TRANSITION
   * --------------------------------------------------
   *
   * CREATED
   *    ↓
   * PROCESSING
   *
   * PROCESSING
   *    ├── PENDING
   *    ├── SUCCESS
   *    └── FAILED
   *
   * PENDING
   *    └── SUCCESS
   *
   * SUCCESS / FAILED
   *    └── FINAL
   */

  const validTransitions = {
    CREATED: [
      "PROCESSING",
    ],

    PROCESSING: [
      "PENDING",
      "SUCCESS",
      "FAILED",
    ],

    PENDING: [
      "SUCCESS",
    ],

    SUCCESS: [],

    FAILED: [],
  };

  const allowedNextStatuses =
    validTransitions[currentStatus] || [];

  if (
    !allowedNextStatuses.includes(
      transactionStatus
    )
  ) {
    const error = new Error(
      `Invalid transaction history status transition: ${currentStatus} -> ${transactionStatus}`
    );

    error.message =
      `Invalid transaction history status transition: ${currentStatus} -> ${transactionStatus}`;

    error.debugMessage =
      "error from updateTransactionHistory.js";

    error.code =
      "INVALID_TRANSACTION_HISTORY_STATUS_TRANSITION";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 9. CONDITIONAL UPDATE
   * --------------------------------------------------
   *
   * Current status is included in WHERE condition.
   *
   * This prevents another concurrent process from
   * overwriting a status change that happened first.
   */

  const [affectedRows] =
    await TransactionHistory.update(
      {
        status: transactionStatus,
      },
      {
        where: {
          id: transactionHistory.id,

          status: currentStatus,
        },
      }
    );


  /*
   * --------------------------------------------------
   * 10. HANDLE CONCURRENT UPDATE
   * --------------------------------------------------
   */

  if (affectedRows === 0) {

    const latestTransactionHistory =
      await TransactionHistory.findOne({
        where: {
          id: transactionHistory.id,
        },
      });

    if (!latestTransactionHistory) {
      const error = new Error(
        "Transaction history not found after concurrent update"
      );

      error.message =
        "Transaction history not found after concurrent update";

      error.debugMessage =
        "error from updateTransactionHistory.js";

      error.code =
        "TRANSACTION_HISTORY_NOT_FOUND";

      throw error;
    }


    /*
     * Another process already reached the requested
     * status.
     */

    if (
      latestTransactionHistory.status ===
      transactionStatus
    ) {
      return {
        success: true,

        orderId: order.id,

        transactionHistoryId:
          latestTransactionHistory.id,

        previousStatus: currentStatus,

        status:
          latestTransactionHistory.status,

        alreadyUpdated: true,
      };
    }


    /*
     * Another process moved it to a final status.
     */

    if (
      latestTransactionHistory.status ===
        "SUCCESS" ||
      latestTransactionHistory.status ===
        "FAILED"
    ) {
      return {
        success: true,

        orderId: order.id,

        transactionHistoryId:
          latestTransactionHistory.id,

        previousStatus: currentStatus,

        status:
          latestTransactionHistory.status,

        alreadyUpdated: true,
      };
    }


    /*
     * Unexpected concurrent state.
     */

    const error = new Error(
      `Transaction history status could not be updated. Current status: ${latestTransactionHistory.status}`
    );

    error.message =
      `Transaction history status could not be updated. Current status: ${latestTransactionHistory.status}`;

    error.debugMessage =
      "error from updateTransactionHistory.js";

    error.code =
      "TRANSACTION_HISTORY_UPDATE_FAILED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 11. RETURN RESULT
   * --------------------------------------------------
   */

  return {
    success: true,

    orderId: order.id,

    transactionHistoryId:
      transactionHistory.id,

    previousStatus: currentStatus,

    status: transactionStatus,

    alreadyUpdated: false,
  };
};


module.exports = {
  updateTransactionHistory,
};