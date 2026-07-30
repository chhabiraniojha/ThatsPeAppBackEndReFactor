const axios = require("axios");

const {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
} = require("../../services/vendorAttemptServices/vendorAttemptService");
const { pollA1Status } = require("../recharge/polla1Status")

exports.a1Recharge = async (data) => {
  let api;
  try {

    api = await getApiByName("A1");

    await createVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
    });

    const a1Params = {
      username: process.env.A1_USERNAME,
      pwd: process.env.A1_PASSWORD,
      circlecode: data.circleCode,
      operatorcode: data.operatorCode,
      number: data.customer_number,
      amount: data.amount,
      orderid: data.rechargeTransactionId,
      format: "json",
    };

    const response = await axios.get(
      "https://business.a1topup.com/recharge/api",
      {
        params: a1Params,
        timeout: 20000,
      }
    );

    const vendorStatus = String(
      response?.data?.Status ||
      response?.data?.status ||
      ""
    ).toUpperCase();

    // SUCCESS

    if (vendorStatus === "SUCCESS") {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: response.data.opid || null,
        rawResponse: response.data,
        message: response.data.Message || null,
      });

      return {
        status: "SUCCESS",
        provider: "A1",
        raw: response.data,
      };
    }

    // PENDING


    // if (vendorStatus === "PENDING") {

    //   await updateVendorAttempt({
    //     rechargeTransactionId: data.rechargeTransactionId,
    //     apiId: api.id,
    //     status: "PENDING",
    //     vendorTransactionId: response.data.opid || null,
    //     rawResponse: response.data,
    //     message: response.data.Message || null,
    //   });

    //   const sleep = (ms) =>
    //     new Promise((resolve) => setTimeout(resolve, ms));

    //   const maxDuration = 20000;
    //   const interval = 5000;

    //   const startTime = Date.now();

    //   while (Date.now() - startTime < maxDuration) {

    //     try {

    //       const statusResponse = await axios.get(
    //         "https://business.a1topup.com/recharge/status",
    //         {
    //           params: {
    //             username: process.env.A1_USERNAME,
    //             pwd: process.env.A1_PASSWORD,
    //             orderid: data.rechargeTransactionId,
    //             format: "json",
    //           },
    //           timeout: 20000,
    //         }
    //       );
    //       console.log('A1 status response is ---------------------------',statusResponse.data)
    //       const status = String(
    //         statusResponse?.data?.Status ||
    //         statusResponse?.data?.status ||
    //         ""
    //       ).toUpperCase();

    //       if (status === "SUCCESS") {

    //         await updateVendorAttempt({
    //           rechargeTransactionId: data.rechargeTransactionId,
    //           apiId: api.id,
    //           status: "SUCCESS",
    //           vendorTransactionId: statusResponse.data.opid || null,
    //           rawResponse: statusResponse.data,
    //           message: statusResponse.data.Message || null,
    //         });

    //         return {
    //           status: "SUCCESS",
    //           provider: "A1",
    //           raw: statusResponse.data,
    //         };
    //       }

    //       if (status === "FAILURE") {

    //         await updateVendorAttempt({
    //           rechargeTransactionId: data.rechargeTransactionId,
    //           apiId: api.id,
    //           status: "FAILED",
    //           vendorTransactionId: statusResponse.data.opid || null,
    //           rawResponse: statusResponse.data,
    //           message: statusResponse.data.Message || null,
    //         });

    //         return {
    //           status: "FAILED",
    //           provider: "A1",
    //           raw: statusResponse.data,
    //         };
    //       }

    //     } catch (err) {
    //       console.error(
    //         `A1 Status Check Error (${data.rechargeTransactionId}):`,
    //         err.message
    //       );
    //       // Ignore this error and continue polling
    //     }

    //     await sleep(interval);
    //   }

    //   // Still pending after 20 seconds
    //   return {
    //     status: "PENDING",
    //     provider: "A1",
    //     raw: response.data,
    //   };
    // }
    if (vendorStatus === "PENDING") {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "PENDING",
        vendorTransactionId: response.data.opid || null,
        rawResponse: response.data,
        message: response.data.Message || null,
      });

      return await pollA1Status(data, api);
    }

    // Immediate FAILURE

    await updateVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
      status: "FAILED",
      vendorTransactionId: response.data.opid || null,
      rawResponse: response.data,
      message: response.data.Message || null,
    });

    return {
      status: "FAILED",
      provider: "A1",
      raw: response.data,
    };

  } catch (error) {
    if (error.code === "ECONNABORTED") {

      console.log("Recharge API timed out. Checking status...");

      const result = await pollA1Status(data, api);

      if (result.status !== "PENDING") {
        return result;
      }
    }
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
      provider: "A1",
      raw: error.response?.data || null,
      error: error.message,
    };

  }
};