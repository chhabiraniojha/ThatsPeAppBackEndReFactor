const axios=require("axios");
const {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
} = require("../../services/vendorAttemptServices/vendorAttemptService");

async function pollA1Status(data, api) {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            orderid: data.rechargeTransactionId,
            format: "json",
          },
          timeout: 20000,
        }
      );

      const status = String(
        statusResponse.data.Status || statusResponse.data.status || ""
      ).toUpperCase();

      if (status === "SUCCESS") {
        await updateVendorAttempt({
          rechargeTransactionId: data.rechargeTransactionId,
          apiId: api.id,
          status: "SUCCESS",
          vendorTransactionId: statusResponse.data.opid || null,
          rawResponse: statusResponse.data,
          message: statusResponse.data.Message || null,
        });

        return {
          status: "SUCCESS",
          provider: "A1",
          raw: statusResponse.data,
        };
      }

      if (status === "FAILURE") {
        await updateVendorAttempt({
          rechargeTransactionId: data.rechargeTransactionId,
          apiId: api.id,
          status: "FAILED",
          vendorTransactionId: statusResponse.data.opid || null,
          rawResponse: statusResponse.data,
          message: statusResponse.data.Message || null,
        });

        return {
          status: "FAILED",
          provider: "A1",
          raw: statusResponse.data,
        };
      }

    } catch (err) {
      console.error("A1 Status Error:", err.message);
    }

    await sleep(interval);
  }

  return {
    status: "PENDING",
    provider: "A1",
  };
}


module.exports = {
    pollA1Status,
};