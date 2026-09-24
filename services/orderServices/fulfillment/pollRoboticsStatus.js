const axios = require("axios");

const pollRoboticsStatus = async ({
  orderId,
  attempt,
}) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.message="OrderId is required-error from pollRoboticsStatus";
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
        "https://api.roboticexchange.in/Robotics/webservice/GetStatus",
        {
          params: {
            Apimember_id: process.env.ROBOTICS_USERNAME,
            Api_password: process.env.ROBOTICS_PASSWORD,
            Member_request_txnid: orderId,
          },
          timeout: 20000,
        }
      );

      const responseData = statusResponse?.data || {};

      const statusCode = Number(
        responseData.STATUS
      );

      /*
       * SUCCESS
       */
      if (statusCode === 1) {
        return {
          status: "SUCCESS",

          vendorTransactionId:
            responseData.OPTRANSID || null,

          message:
            responseData.MESSAGE || null,

          rawResponse: responseData,

          provider: "RoboticsExchange",
        };
      }

      /*
       * FAILED
       */
      if (statusCode === 0) {
        return {
          status: "FAILED",

          vendorTransactionId:
            responseData.OPTRANSID || null,

          message:
            responseData.MESSAGE || null,

          rawResponse: responseData,

          provider: "RoboticsExchange",
        };
      }

    } catch (error) {
      /*
       * Status API error ko FAILED nahi maana jayega.
       * Next interval me dobara status check hoga.
       */
      console.error(
        "Robotics Status Check Error:",
        error.message
      );
    }

    await sleep(interval);
  }

  /*
   * 20 seconds ke andar final status nahi mila.
   */
  return {
    status: "PENDING",

    vendorTransactionId:
      attempt.vendorTransactionId || null,

    message:
      "RoboticsExchange transaction is still pending",

    rawResponse: null,

    provider: "RoboticsExchange",
  };
};

module.exports = {
  pollRoboticsStatus,
};