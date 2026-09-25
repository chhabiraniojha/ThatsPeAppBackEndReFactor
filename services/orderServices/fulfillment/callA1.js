const axios = require("axios");

const pollA1Status = require("./pollA1Status");

const callA1 = async ({
  order,
  vendor,
  operatorVendor,
  attempt,
}) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */
  console.log("========== CALL A1 STARTED ==========");
  console.log("ORDER ID:", order?.id);
  if (!order) {
    const error = new Error("Order is required");
    error.code = "ORDER_REQUIRED";
    throw error;
  }

  if (!vendor) {
    const error = new Error("A1 vendor is required");
    error.code = "VENDOR_REQUIRED";
    throw error;
  }

  if (!operatorVendor) {
    const error = new Error(
      "A1 operator mapping is required"
    );

    error.code =
      "OPERATOR_VENDOR_MAPPING_REQUIRED";

    throw error;
  }

  if (!attempt) {
    const error = new Error(
      "A1 vendor attempt is required"
    );

    error.code =
      "VENDOR_ATTEMPT_REQUIRED";

    throw error;
  }

  console.log("serviceName:", serviceName);
  console.log("order.circleId:", order.circleId);
  console.log("order:", order);

  /*
   * --------------------------------------------------
   * 2. ORDER DATA
   * --------------------------------------------------
   */

  const orderId = order.id;

  const fields = order.fields;

  const amount = Number(order.amount);

  /*
   * --------------------------------------------------
   * 3. VALIDATION
   * --------------------------------------------------
   */

  if (!orderId) {
    const error = new Error(
      "Order ID is missing"
    );

    error.code = "ORDER_ID_MISSING";

    throw error;
  }

  if (
    !Array.isArray(fields) ||
    fields.length === 0
  ) {
    const error = new Error(
      "Order fields are missing"
    );

    error.code = "ORDER_FIELDS_MISSING";

    throw error;
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    const error = new Error(
      "Invalid order amount"
    );

    error.code = "INVALID_ORDER_AMOUNT";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 4. GET REQUIRED A1 PARAMETERS
   * --------------------------------------------------
   *
   * Current operator mapping should provide
   * A1 operator code.
   *
   * Circle code is required for Prepaid.
   */

  const operatorCode =
    operatorVendor.vendorOperatorCode;

  if (!operatorCode) {
    const error = new Error(
      "A1 operator code is missing"
    );

    error.code =
      "A1_OPERATOR_CODE_MISSING";

    throw error;
  }

  /*
   * Circle code
   *
   * Prepaid requires circle code.
   * For other services it can be null.
   *
   * Current Order already contains circle relation.
   */

  const serviceName = String(
    order.service?.name || ""
  )
    .trim()
    .toUpperCase();

  const circleCode =
    serviceName === "PREPAID"
      ? order.circleId || null
      : null;
  console.log("circleCode is", circleCode)
  if (
    serviceName === "PREPAID" &&
    !circleCode
  ) {
    const error = new Error(
      "Circle code is required for A1 Prepaid recharge"
    );

    error.code =
      "A1_CIRCLE_CODE_MISSING";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 5. CUSTOMER MOBILE
   * --------------------------------------------------
   */

  const customerNumber =
    order.user?.mobileNo;

  if (!customerNumber) {
    const error = new Error(
      "Customer mobile number is missing"
    );

    error.code =
      "CUSTOMER_MOBILE_MISSING";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 6. A1 REQUEST PARAMETERS
   * --------------------------------------------------
   */

  const a1Params = {
    username: process.env.A1_USERNAME,
    pwd: process.env.A1_PASSWORD,

    circlecode: circleCode,

    operatorcode: operatorCode,

    number: customerNumber,

    amount,

    orderid: orderId,

    format: "json",
  };

  /*
   * --------------------------------------------------
   * 7. CALL A1 RECHARGE API
   * --------------------------------------------------
   */

  let response;

  try {
    response = await axios.get(
      "https://business.a1topup.com/recharge/api",
      {
        params: a1Params,
        timeout: 20000,
      }
    );
  } catch (error) {
    /*
     * ------------------------------------------------
     * TIMEOUT / NETWORK ERROR
     * ------------------------------------------------
     *
     * Recharge API ka response nahi mila.
     *
     * Is situation me direct FAILED nahi karna hai.
     * Transaction ambiguous hai.
     *
     * Isliye A1 status API se check karenge.
     */

    const pollResult =
      await pollA1Status({
        orderId,
        attempt,
      });

    return pollResult;
  }

  /*
   * --------------------------------------------------
   * 8. NORMALIZE A1 RESPONSE
   * --------------------------------------------------
   */

  const responseData =
    response?.data || {};

  const vendorStatus = String(
    responseData.Status ||
    responseData.status ||
    ""
  )
    .trim()
    .toUpperCase();

  const vendorTransactionId =
    responseData.opid ||
    responseData.opId ||
    responseData.OPID ||
    null;

  const message =
    responseData.Message ||
    responseData.message ||
    null;

  /*
   * --------------------------------------------------
   * 9. SUCCESS
   * --------------------------------------------------
   */

  if (vendorStatus === "SUCCESS") {
    return {
      status: "SUCCESS",

      vendorTransactionId,

      message,

      rawResponse: responseData,

      provider: "A1",
    };
  }

  /*
   * --------------------------------------------------
   * 10. PENDING
   * --------------------------------------------------
   *
   * A1 ne PENDING diya.
   *
   * Status API se max 20 seconds tak
   * check karenge.
   */

  if (vendorStatus === "PENDING") {
    return await pollA1Status({
      orderId,
      attempt: {
        ...attempt,
        vendorTransactionId:
          vendorTransactionId ||
          attempt.vendorTransactionId ||
          null,
      },
    });
  }

  /*
   * --------------------------------------------------
   * 11. FAILURE
   * --------------------------------------------------
   *
   * Current A1 implementation me SUCCESS aur
   * PENDING ke alawa response ko failure maana jayega.
   */

  return {
    status: "FAILED",

    vendorTransactionId,

    message:
      message ||
      `A1 returned status: ${vendorStatus || "UNKNOWN"
      }`,

    rawResponse: responseData,

    provider: "A1",
  };
};

module.exports = callA1;