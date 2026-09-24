const axios = require("axios");

const pollA1Status = async ({
  orderId,
  attempt,
}) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.message="OrderId is required-error from pollA1Status";
    error.code = "ORDER_ID_REQUIRED";
    throw error;
  }

  if (!attempt) {
    const error = new Error("Vendor attempt is required");
    error.code = "VENDOR_ATTEMPT_REQUIRED";
    throw error;
  }

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const maxDuration = 20000;
  const interval = 5000;

  const startTime = Date.now();

  while (Date.now() - startTime < maxDuration) {
    try {
      const statusResponse = await axios.get(
        "https://business.a1topup.com/recharge/status",
        {
          params: {
            username: process.env.A1_USERNAME,
            pwd: process.env.A1_PASSWORD,
            orderid: orderId,
            format: "json",
          },

          timeout: 20000,
        }
      );

      const responseData = statusResponse?.data || {};

      const status = String(
        responseData.Status ||
          responseData.status ||
          ""
      ).toUpperCase();

      /*
       * -----------------------------------------------
       * SUCCESS
       * -----------------------------------------------
       */

      if (status === "SUCCESS") {
        return {
          status: "SUCCESS",

          vendorTransactionId:
            responseData.opid || null,

          message:
            responseData.Message ||
            responseData.message ||
            null,

          rawResponse: responseData,

          provider: "A1",
        };
      }

      /*
       * -----------------------------------------------
       * FAILURE
       * -----------------------------------------------
       */

      if (
        status === "FAILURE" ||
        status === "FAILED"
      ) {
        return {
          status: "FAILED",

          vendorTransactionId:
            responseData.opid || null,

          message:
            responseData.Message ||
            responseData.message ||
            null,

          rawResponse: responseData,

          provider: "A1",
        };
      }

    } catch (error) {
      /*
       * Status API error ke case me polling
       * immediately stop nahi hogi.
       *
       * Next interval me dobara status check hoga.
       */
      console.error(
        "A1 Status Check Error:",
        error.message
      );
    }

    await sleep(interval);
  }

  /*
   * 20 seconds ke andar final status nahi mila.
   *
   * Iska matlab transaction ko abhi PENDING
   * treat karna hai.
   */

  return {
    status: "PENDING",

    vendorTransactionId:
      attempt.vendorTransactionId || null,

    message:
      "A1 transaction status is still pending",

    rawResponse: null,

    provider: "A1",
  };
};

module.exports = {
  pollA1Status,
};