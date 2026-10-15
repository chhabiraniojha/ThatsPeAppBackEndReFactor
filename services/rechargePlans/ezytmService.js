
const axios = require("axios");

const EZYTM_OPERATOR_LOOKUP_URL =
  "http://planapi.in/api/Mobile/OperatorFetchNew";

exports.lookupOperator = async (mobileNo) => {
  const apiUserId = process.env.EZYTM_API_USER_ID;
  const apiPassword = process.env.EZYTM_API_PASSWORD;

  if (!apiUserId || !apiPassword) {
    throw new Error("Ezytm API credentials are not configured");
  }

  let response;

  // --------------------------------
  // 1. Call Ezytm operator lookup API
  // --------------------------------
  try {
    response = await axios.get(EZYTM_OPERATOR_LOOKUP_URL, {
      params: {
        ApiUserID: apiUserId,
        ApiPassword: apiPassword,
        Mobileno: mobileNo,
      },
      timeout: 8000,
    });
  } catch (error) {
    // External provider/network failure:
    // caller can handle fallback/exhausted providers.
    if (axios.isAxiosError(error)) {
      return null;
    }

    // Unexpected internal errors must propagate.
    throw error;
  }

  // --------------------------------
  // 2. Validate Ezytm response
  // --------------------------------
  const result = response.data;

  if (!result || result.ERROR === undefined) {
    return null;
  }

  // --------------------------------
  // 3. Invalid credentials
  // --------------------------------
  if (String(result.ERROR) === "1") {
    const error = new Error("Ezytm authentication failed");
    error.code = "EZYTM_AUTH_ERROR";
    throw error;
  }

  // --------------------------------
  // 4. Successful operator lookup
  // --------------------------------
  if (String(result.ERROR) === "0") {
    if (
      result.CircleCode === undefined ||
      result.OpCode === undefined ||
      String(result.CircleCode).trim() === "" ||
      String(result.OpCode).trim() === ""
    ) {
      return null;
    }

    return {
      provider: "Ezytm",
      operatorCode: String(result.OpCode).trim(),
      circleCode: String(result.CircleCode).trim(),
    };
  }

  // --------------------------------
  // 5. Invalid mobile number
  // --------------------------------
  if (String(result.ERROR) === "10") {
    const error = new Error("Invalid mobile number");
    error.code = "INVALID_MOBILE_NUMBER";
    error.statusCode = 400;
    throw error;
  }

  // Unknown provider response
  return null;
};
