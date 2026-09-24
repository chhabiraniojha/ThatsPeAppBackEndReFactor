const validateOrderForFulfillment = async (order) => {
  /*
   * --------------------------------------------------
   * 1. ORDER EXISTENCE VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. ORDER STATUS VALIDATION
   * --------------------------------------------------
   *
   * Normal fulfillment can start only from CREATED.
   *
   * CREATED
   *    ↓
   * PROCESSING
   *    ├── SUCCESS
   *    ├── PENDING
   *    └── FAILED
   *
   * PENDING means vendor processing is waiting
   * for final confirmation.
   *
   * Vendor callback does NOT call fulfillment again.
   */

  if (order.status !== "CREATED") {
    const error = new Error(
      `Order cannot be fulfilled in ${order.status} status`
    );

    error.message =
      `Order cannot be fulfilled in ${order.status} status`;

    error.debugMessage =
      "error from validateOrderForFulfillment.js";

    error.code =
      "INVALID_ORDER_STATUS_FOR_FULFILLMENT";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 3. PAYMENT METHOD VALIDATION
   * --------------------------------------------------
   */

  const validPaymentMethods = [
    "UPI",
    "WALLET",
    "COMBO",
  ];

  if (!validPaymentMethods.includes(order.paymentMethod)) {
    const error = new Error("Invalid payment method");

    error.message = "Invalid payment method";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code = "INVALID_PAYMENT_METHOD";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 4. FINAL PAYABLE AMOUNT VALIDATION
   * --------------------------------------------------
   *
   * finalPayableAmount must be greater than 0.
   *
   * ₹0 order is not allowed.
   */

  const finalPayableAmount =
    Number(order.finalPayableAmount);

  if (
    !Number.isFinite(finalPayableAmount) ||
    finalPayableAmount <= 0
  ) {
    const error = new Error(
      "Invalid final payable amount"
    );

    error.message = "Invalid final payable amount";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code =
      "INVALID_FINAL_PAYABLE_AMOUNT";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 5. WALLET AMOUNT VALIDATION
   * --------------------------------------------------
   */

  const walletAmount = Number(order.walletAmount);

  if (
    !Number.isFinite(walletAmount) ||
    walletAmount < 0
  ) {
    const error = new Error("Invalid wallet amount");

    error.message = "Invalid wallet amount";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code = "INVALID_WALLET_AMOUNT";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 6. ONLINE PAYMENT AMOUNT VALIDATION
   * --------------------------------------------------
   */

  const onlinePaidAmount =
    Number(order.onlinePaidAmount);

  if (
    !Number.isFinite(onlinePaidAmount) ||
    onlinePaidAmount < 0
  ) {
    const error = new Error(
      "Invalid online paid amount"
    );

    error.message = "Invalid online paid amount";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code =
      "INVALID_ONLINE_PAID_AMOUNT";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 7. PAYMENT SPLIT VALIDATION
   * --------------------------------------------------
   *
   * walletAmount + onlinePaidAmount
   * must exactly equal finalPayableAmount.
   */

  const totalPaid = Number(
    (walletAmount + onlinePaidAmount).toFixed(2)
  );

  const payableAmount = Number(
    finalPayableAmount.toFixed(2)
  );

  if (totalPaid !== payableAmount) {
    const error = new Error(
      "Wallet amount and online paid amount do not match final payable amount"
    );

    error.message =
      "Wallet amount and online paid amount do not match final payable amount";

    error.debugMessage =
      "error from validateOrderForFulfillment.js";

    error.code = "PAYMENT_SPLIT_MISMATCH";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 8. UPI PAYMENT VALIDATION
   * --------------------------------------------------
   *
   * UPI:
   *
   * walletAmount = 0
   * onlinePaidAmount = finalPayableAmount
   */

  if (order.paymentMethod === "UPI") {
    if (
      walletAmount !== 0 ||
      onlinePaidAmount !== payableAmount
    ) {
      const error = new Error(
        "Invalid UPI payment split"
      );

      error.message =
        "Invalid UPI payment split";

      error.debugMessage =
        "error from validateOrderForFulfillment.js";

      error.code =
        "INVALID_UPI_PAYMENT_SPLIT";

      throw error;
    }
  }


  /*
   * --------------------------------------------------
   * 9. WALLET PAYMENT VALIDATION
   * --------------------------------------------------
   *
   * WALLET:
   *
   * onlinePaidAmount = 0
   * walletAmount = finalPayableAmount
   */

  if (order.paymentMethod === "WALLET") {
    if (
      onlinePaidAmount !== 0 ||
      walletAmount !== payableAmount
    ) {
      const error = new Error(
        "Invalid wallet payment split"
      );

      error.message =
        "Invalid wallet payment split";

      error.debugMessage =
        "error from validateOrderForFulfillment.js";

      error.code =
        "INVALID_WALLET_PAYMENT_SPLIT";

      throw error;
    }
  }


  /*
   * --------------------------------------------------
   * 10. COMBO PAYMENT VALIDATION
   * --------------------------------------------------
   *
   * COMBO:
   *
   * walletAmount > 0
   * onlinePaidAmount > 0
   *
   * Both payment sources are compulsory.
   */

  if (order.paymentMethod === "COMBO") {
    if (
      walletAmount <= 0 ||
      onlinePaidAmount <= 0
    ) {
      const error = new Error(
        "Invalid combo payment split"
      );

      error.message =
        "Invalid combo payment split";

      error.debugMessage =
        "error from validateOrderForFulfillment.js";

      error.code =
        "INVALID_COMBO_PAYMENT_SPLIT";

      throw error;
    }
  }


  /*
   * --------------------------------------------------
   * 11. REQUIRED ORDER DATA VALIDATION
   * --------------------------------------------------
   */

  if (!order.id) {
    const error = new Error("Order ID is missing");

    error.message = "Order ID is missing";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code = "ORDER_ID_MISSING";

    throw error;
  }

  if (!order.userId) {
    const error = new Error(
      "Order user ID is missing"
    );

    error.message = "Order user ID is missing";
    error.debugMessage =
      "error from validateOrderForFulfillment.js";
    error.code = "ORDER_USER_ID_MISSING";

    throw error;
  }

  if (!order.serviceType) {
    const error = new Error(
      "Order service type is missing"
    );

    error.message =
      "Order service type is missing";

    error.debugMessage =
      "error from validateOrderForFulfillment.js";

    error.code =
      "ORDER_SERVICE_TYPE_MISSING";

    throw error;
  }

  if (!order.operatorId) {
    const error = new Error(
      "Order operator ID is missing"
    );

    error.message =
      "Order operator ID is missing";

    error.debugMessage =
      "error from validateOrderForFulfillment.js";

    error.code =
      "ORDER_OPERATOR_ID_MISSING";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 12. ORDER FIELDS VALIDATION
   * --------------------------------------------------
   *
   * fields is the snapshot created during Order Create.
   *
   * Fulfillment uses this data to build the
   * vendor request.
   */

  if (
    !order.fields ||
    !Array.isArray(order.fields) ||
    order.fields.length === 0
  ) {
    const error = new Error(
      "Order fields are missing or invalid"
    );

    error.message =
      "Order fields are missing or invalid";

    error.debugMessage =
      "error from validateOrderForFulfillment.js";

    error.code = "ORDER_FIELDS_INVALID";

    throw error;
  }


  /*
   * --------------------------------------------------
   * VALIDATION SUCCESS
   * --------------------------------------------------
   */

  return order;
};


module.exports = {
  validateOrderForFulfillment,
};