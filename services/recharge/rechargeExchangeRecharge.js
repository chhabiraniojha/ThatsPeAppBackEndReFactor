const axios = require("axios");

const {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
  getVendorAttempt,
} = require("../vendorAttemptServices/vendorAttemptService");

exports.rechargeExchange = async (data) => {
  let api;

  try {
    api = await getApiByName("RechargeExchange");

    // Create vendor attempt
    await createVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
    });

    const rechargeExchangeParams = {
      userid: process.env.RECHARGEEXCHANGE_USERNAME,
      token: process.env.RECHARGEEXCHANGE_PASSWORD,
      opcode: data.operatorCode,
      number: data.customer_number,
      amount: data.amount,
      transid: data.rechargeTransactionId,
    };

    const response = await axios.get(
      "https://api.RechargeExchange.com/API.asmx/Transaction",
      {
        params: rechargeExchangeParams,
        timeout: 30000,
      }
    );

    const vendorStatus = String(
      response?.data?.status || ""
    ).toUpperCase();

    /* ---------------- SUCCESS ---------------- */

    if (vendorStatus === "SUCCESS") {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: response.data.optransid || null,
        rawResponse: response.data,
        message: response.data.message || null,
      });

      return {
        status: "SUCCESS",
        provider: "RechargeExchange",
        raw: response.data,
      };
    }

    /* ---------------- PENDING ---------------- */

    if (vendorStatus === "PENDING") {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "PENDING",
        vendorTransactionId: response.data.optransid || null,
        rawResponse: response.data,
        message: response.data.message || null,
      });

      const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const maxDuration = 20000;
      const interval = 5000;

      const startTime = Date.now();

      while (Date.now() - startTime < maxDuration) {

        try {

          const attempt = await getVendorAttempt({
            rechargeTransactionId: data.rechargeTransactionId,
            apiId: api.id,
          });

          const status = attempt?.status?.toUpperCase();

          if (status === "SUCCESS") {
            return {
              status: "SUCCESS",
              provider: "RechargeExchange",
              raw: attempt,
            };
          }

          if (status === "FAILED") {
            return {
              status: "FAILED",
              provider: "RechargeExchange",
              raw: attempt,
            };
          }

        } catch (err) {

          console.error(
            `RechargeExchange Status Check Error (${data.rechargeTransactionId}):`,
            err.message
          );

        }

        await sleep(interval);
      }

      return {
        status: "PENDING",
        provider: "RechargeExchange",
        raw: response.data,
      };
    }

    /* ---------------- FAILED ---------------- */

    await updateVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
      status: "FAILED",
      vendorTransactionId: response.data.optransid || null,
      rawResponse: response.data,
      message: response.data.message || null,
    });

    return {
      status: "FAILED",
      provider: "RechargeExchange",
      raw: response.data,
    };

  } catch (error) {

    if (api) {
      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "PENDING",
        rawResponse: error.response?.data || null,
        message: error.message,
      });
    }

    return {
      status: "PENDING",
      provider: "RechargeExchange",
      raw: error.response?.data || null,
      error: error.message,
    };
  }
};