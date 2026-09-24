const axios = require("axios");

const {
  pollRoboticsStatus,
} = require("./pollRoboticsStatus");

const callRoboticsExchange = async ({
  order,
  vendor,
  operatorVendor,
  attempt,
}) => {
  /*
   * --------------------------------------------------
   * 1. Basic Validation
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");
    error.code = "ORDER_REQUIRED";
    throw error;
  }

  if (!vendor) {
    const error = new Error(
      "RoboticsExchange vendor is required"
    );

    error.code = "VENDOR_REQUIRED";

    throw error;
  }

  if (!operatorVendor) {
    const error = new Error(
      "RoboticsExchange operator mapping is required"
    );

    error.code = "OPERATOR_VENDOR_MAPPING_REQUIRED";

    throw error;
  }

  if (!attempt) {
    const error = new Error(
      "RoboticsExchange vendor attempt is required"
    );

    error.code = "VENDOR_ATTEMPT_REQUIRED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 2. Get Customer Number
   * --------------------------------------------------
   *
   * Customer number order.fields ke andar
   * fieldKey = "cn" me milega.
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
   * 3. Operator Code
   * --------------------------------------------------
   *
   * OperatorVendorMapping se aayega.
   */

  const operatorCode =
    operatorVendor.vendorOperatorCode;

  if (!operatorCode) {
    const error = new Error(
      "RoboticsExchange operator code is not configured"
    );

    error.code =
      "ROBOTICS_OPERATOR_CODE_NOT_CONFIGURED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 4. Circle Code
   * --------------------------------------------------
   *
   * CircleVendorMapping se actual circle code
   * baad me yahan pass hoga.
   *
   * Abhi mapping code finalize nahi hua hai.
   */


  /*
   * --------------------------------------------------
   * 5. Amount
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
   * 6. RoboticsExchange API Parameters
   * --------------------------------------------------
   */

  const roboticsParams = {
    Apimember_id:
      process.env.ROBOTICS_USERNAME,

    Api_password:
      process.env.ROBOTICS_PASSWORD,

    Mobile_no:
      customerNumber,

    Operator_code:
      operatorCode,

    Amount:
      amount,

    Member_request_txnid:
      order.id,

    Circle:
      order.circleId,
  };

  try {
    /*
     * ------------------------------------------------
     * 7. Initial Recharge API Call
     * ------------------------------------------------
     */

    const response = await axios.get(
      "https://api.roboticexchange.in/Robotics/webservice/GetMobileRecharge",
      {
        params: roboticsParams,
        timeout: 30000,
      }
    );

    const responseData =
      response?.data || {};

    const statusCode = Number(
      responseData.STATUS
    );

    /*
     * ------------------------------------------------
     * 8. SUCCESS
     * ------------------------------------------------
     */

    if (statusCode === 1) {
      return {
        status: "SUCCESS",

        vendorTransactionId:
          responseData.OPTRANSID || null,

        message:
          responseData.MESSAGE || null,

        rawResponse:
          responseData,

        provider:
          "RoboticsExchange",
      };
    }

    /*
     * ------------------------------------------------
     * 9. PENDING
     * ------------------------------------------------
     *
     * Robotics ne PENDING diya hai,
     * isliye status API se polling karenge.
     */

    if (statusCode === 2) {
      return await pollRoboticsStatus({
        orderId: order.id,
        attempt,
      });
    }

    /*
     * ------------------------------------------------
     * 10. FAILED
     * ------------------------------------------------
     */

    return {
      status: "FAILED",

      vendorTransactionId:
        responseData.OPTRANSID || null,

      message:
        responseData.MESSAGE ||
        "RoboticsExchange recharge failed",

      rawResponse:
        responseData,

      provider:
        "RoboticsExchange",
    };

  } catch (error) {
    /*
     * ------------------------------------------------
     * 11. API Error / Timeout
     * ------------------------------------------------
     *
     * API request fail hone ka matlab ye nahi hai
     * ki recharge definitely failed hai.
     *
     * Vendor ne recharge process kar diya ho sakta hai
     * lekin response humare server tak nahi aaya.
     *
     * Isliye A1 ki tarah status API poll karenge.
     */

    return await pollRoboticsStatus({
      orderId: order.id,
      attempt,
    });
  }
};

module.exports = callRoboticsExchange;