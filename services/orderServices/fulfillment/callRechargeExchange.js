const axios = require("axios");

const RechargeVendorAttempt = require(
  "../../../models/VendorAttemptModels/vendorAttempts"
);

const callRechargeExchange = async ({
  order,
  vendor,
  operatorVendor,
  attempt,
}) => {
  if (!order) {
    const error = new Error("Order is required");
    error.code = "ORDER_REQUIRED";
    throw error;
  }

  if (!vendor) {
    const error = new Error(
      "RechargeExchange vendor is required"
    );
    error.code = "VENDOR_REQUIRED";
    throw error;
  }

  if (!operatorVendor) {
    const error = new Error(
      "RechargeExchange operator mapping is required"
    );
    error.code = "OPERATOR_VENDOR_MAPPING_REQUIRED";
    throw error;
  }

  if (!attempt) {
    const error = new Error(
      "RechargeExchange vendor attempt is required"
    );
    error.code = "VENDOR_ATTEMPT_REQUIRED";
    throw error;
  }

  /*
   * --------------------------------------------------
   * 1. GET CUSTOMER NUMBER
   * --------------------------------------------------
   */

  const fields = Array.isArray(order.fields)
    ? order.fields
    : [];

  const customerField = fields.find(
    (field) =>
      String(field.fieldKey || "").toLowerCase() === "cn"
  );

  if (!customerField) {
    const error = new Error(
      "Customer number field (cn) not found in order"
    );

    error.code = "CUSTOMER_NUMBER_FIELD_NOT_FOUND";

    throw error;
  }

  const customerNumber = String(
    customerField.value || ""
  ).trim();

  if (!customerNumber) {
    const error = new Error(
      "Customer number is required"
    );

    error.code = "CUSTOMER_NUMBER_REQUIRED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 2. OPERATOR CODE
   * --------------------------------------------------
   */

  const operatorCode =
    operatorVendor.vendorOperatorCode;

  if (!operatorCode) {
    const error = new Error(
      "RechargeExchange operator code is not configured"
    );

    error.code =
      "RECHARGE_EXCHANGE_OPERATOR_CODE_NOT_CONFIGURED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 3. AMOUNT
   * --------------------------------------------------
   */

  const amount = Number(order.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error(
      "Invalid order amount"
    );

    error.code = "INVALID_ORDER_AMOUNT";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 4. REQUEST PARAMETERS
   * --------------------------------------------------
   */

  const rechargeExchangeParams = {
    userid: process.env.RECHARGEEXCHANGE_USERNAME,
    token: process.env.RECHARGEEXCHANGE_PASSWORD,
    opcode: operatorCode,
    number: customerNumber,
    amount,
    transid: order.id,
  };

  /*
   * --------------------------------------------------
   * 5. CALL RECHARGE EXCHANGE
   * --------------------------------------------------
   */

  try {
    const response = await axios.get(
      "https://api.RechargeExchange.com/API.asmx/Transaction",
      {
        params: rechargeExchangeParams,
        timeout: 30000,
      }
    );

    const responseData =
      response?.data || {};

    const vendorStatus = String(
      responseData.status || ""
    )
      .trim()
      .toUpperCase();

    const vendorTransactionId =
      responseData.optransid || null;

    /*
     * ------------------------------------------------
     * SUCCESS
     * ------------------------------------------------
     */

    if (vendorStatus === "SUCCESS") {
      return {
        status: "SUCCESS",

        vendorTransactionId,

        message:
          responseData.message || null,

        rawResponse: responseData,

        provider: "RechargeExchange",
      };
    }

    /*
     * ------------------------------------------------
     * PENDING
     * ------------------------------------------------
     *
     * Wait for callback for a short period.
     */

    if (vendorStatus === "PENDING") {
      return await waitForRechargeExchangeCallback({
        orderId: order.id,
        attemptId: attempt.id,
        initialResponse: responseData,
      });
    }

    /*
     * ------------------------------------------------
     * FAILED
     * ------------------------------------------------
     */

    return {
      status: "FAILED",

      vendorTransactionId,

      message:
        responseData.message ||
        `RechargeExchange returned status: ${
          vendorStatus || "UNKNOWN"
        }`,

      rawResponse: responseData,

      provider: "RechargeExchange",
    };
  } catch (error) {
    /*
     * ------------------------------------------------
     * API ERROR / TIMEOUT
     * ------------------------------------------------
     *
     * Recharge may have received the request but
     * response may not have reached us.
     *
     * Therefore do not immediately mark FAILED.
     *
     * Check callback-updated attempt.
     */

    return await waitForRechargeExchangeCallback({
      orderId: order.id,

      attemptId: attempt.id,

      initialResponse:
        error.response?.data || null,

      errorMessage: error.message,
    });
  }
};

/*
 * ==================================================
 * WAIT FOR RECHARGE EXCHANGE CALLBACK
 * ==================================================
 */

const waitForRechargeExchangeCallback = async ({
  orderId,
  attemptId,
  initialResponse,
  errorMessage = null,
}) => {
  const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const maxDuration = 20000;
  const interval = 5000;

  const startTime = Date.now();

  while (
    Date.now() - startTime <
    maxDuration
  ) {
    try {
      const attempt =
        await RechargeVendorAttempt.findOne({
          where: {
            id: attemptId,
            orderId,
          },

          attributes: [
            "id",
            "orderId",
            "vendorId",
            "vendorTransactionId",
            "status",
            "message",
            "rawResponse",
            "callbackReceived",
            "callbackAt",
          ],
        });

      const status = String(
        attempt?.status || ""
      ).toUpperCase();

      /*
       * Callback SUCCESS
       */

      if (status === "SUCCESS") {
        return {
          status: "SUCCESS",

          vendorTransactionId:
            attempt.vendorTransactionId || null,

          message:
            attempt.message || null,

          rawResponse:
            attempt.rawResponse ||
            initialResponse,

          provider: "RechargeExchange",
        };
      }

      /*
       * Callback FAILED
       */

      if (status === "FAILED") {
        return {
          status: "FAILED",

          vendorTransactionId:
            attempt.vendorTransactionId || null,

          message:
            attempt.message || null,

          rawResponse:
            attempt.rawResponse ||
            initialResponse,

          provider: "RechargeExchange",
        };
      }
    } catch (error) {
      /*
       * DB read error ko FAILED nahi karna.
       *
       * Next interval me dobara check karenge.
       */
    }

    await sleep(interval);
  }

  /*
   * --------------------------------------------------
   * CALLBACK NOT RECEIVED
   * --------------------------------------------------
   *
   * Transaction remains PENDING.
   */

  return {
    status: "PENDING",

    vendorTransactionId:
      initialResponse?.optransid || null,

    message:
      errorMessage ||
      "RechargeExchange transaction is still pending",

    rawResponse:
      initialResponse || null,

    provider: "RechargeExchange",
  };
};

module.exports = callRechargeExchange;