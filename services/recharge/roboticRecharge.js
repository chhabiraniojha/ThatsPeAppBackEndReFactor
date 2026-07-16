const axios = require("axios");

const {
  getApiByName,
  createVendorAttempt,
  updateVendorAttempt,
} = require("../vendorAttemptServices/vendorAttemptService");

exports.roboticRecharge = async (data) => {
  let api;

  try {
    api = await getApiByName("RoboticsExchange");

    // Create vendor attempt
    await createVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
    });

    const roboticsParams = {
      Apimember_id: process.env.ROBOTICS_USERNAME,
      Api_password: process.env.ROBOTICS_PASSWORD,
      Mobile_no: data.customer_number,
      Operator_code: data.operatorCode,
      Amount: data.amount,
      Member_request_txnid: data.rechargeTransactionId,
      Circle: data.circleCode,
    };

    const response = await axios.get(
      "https://api.roboticexchange.in/Robotics/webservice/GetMobileRecharge",
      {
        params: roboticsParams,
        timeout: 7000,
      }
    );

    const statusCode = Number(response?.data?.STATUS);

    /* ---------------- SUCCESS ---------------- */

    if (statusCode === 1) {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "SUCCESS",
        vendorTransactionId: response.data.OPTRANSID || null,
        rawResponse: response.data,
        message:response.data.MESSAGE || null,
      });

      return {
        status: "SUCCESS",
        provider: "RoboticsExchange",
        raw: response.data,
      };
    }

    /* ---------------- PENDING ---------------- */

    if (statusCode === 2) {

      await updateVendorAttempt({
        rechargeTransactionId: data.rechargeTransactionId,
        apiId: api.id,
        status: "PENDING",
        vendorTransactionId: response.data.OPTRANSID || null,
        rawResponse: response.data,
        message: response.data.MESSAGE || null,
      });

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
                Member_request_txnid: data.rechargeTransactionId,
              },
              timeout: 7000,
            }
          );

          const status = Number(statusResponse?.data?.STATUS);

          if (status === 1) {

            await updateVendorAttempt({
              rechargeTransactionId: data.rechargeTransactionId,
              apiId: api.id,
              status: "SUCCESS",
              vendorTransactionId:
                statusResponse.data.OPTRANSID ||
                null,
              rawResponse: statusResponse.data,
              message: statusResponse.data.MESSAGE || null,
            });

            return {
              status: "SUCCESS",
              provider: "RoboticsExchange",
              raw: statusResponse.data,
            };
          }

          if (status === 0) {

            await updateVendorAttempt({
              rechargeTransactionId: data.rechargeTransactionId,
              apiId: api.id,
              status: "FAILED",
              vendorTransactionId:
                statusResponse.data.OPTRANSID ||
                null,
              rawResponse: statusResponse.data,
              message:
                statusResponse.data.MESSAGE ||
                null,
            });

            return {
              status: "FAILED",
              provider: "RoboticsExchange",
              raw: statusResponse.data,
            };
          }

        } catch (err) {

          console.error(
            `Robotics Status Check Error (${data.rechargeTransactionId}):`,
            err.message
          );

        }

        await sleep(interval);
      }

      return {
        status: "PENDING",
        provider: "RoboticsExchange",
        raw: response.data,
      };
    }

    /* ---------------- FAILED ---------------- */

    await updateVendorAttempt({
      rechargeTransactionId: data.rechargeTransactionId,
      apiId: api.id,
      status: "FAILED",
      vendorTransactionId: response.data.OPTRANSID || null,
      rawResponse: response.data,
      message: response.data.MESSAGE || null,
    });

    return {
      status: "FAILED",
      provider: "RoboticsExchange",
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
      provider: "RoboticsExchange",
      raw: error.response?.data || null,
      error: error.message,
    };
  }
};