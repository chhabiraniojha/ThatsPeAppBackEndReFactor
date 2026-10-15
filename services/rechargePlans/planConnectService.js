
const axios = require("axios");

const PLANCONNECT_URL =
  "https://www.planconnect.in/api/operatorCheck";

exports.lookupOperator = async (mobileNo) => {
  if (!process.env.PLANCONNECT_API_KEY) {
    throw new Error("PLANCONNECT_API_KEY is not configured");
  }

  let response;

  // --------------------------------
  // 1. External API request
  // --------------------------------
  try {
    response = await axios.get(PLANCONNECT_URL, {
      params: {
        apiKey: process.env.PLANCONNECT_API_KEY,
        mobileNo,
      },
      timeout: 8000,
    });
  } catch (error) {
    // Only Axios request failures should trigger fallback.
    if (axios.isAxiosError(error)) {
      return null;
    }

    // Our own unexpected errors must propagate.
    throw error;
  }

  // --------------------------------
  // 2. Validate provider response
  // --------------------------------
  const result = response.data;

  if (
    result?.status !== "Success" ||
    typeof result?.data?.operator !== "string" ||
    typeof result?.data?.circle !== "string" ||
    !result.data.operator.trim() ||
    !result.data.circle.trim()
  ) {
    return null;
  }

  // --------------------------------
  // 3. Return normalized result
  // --------------------------------
  return {
    provider: "PlanConnect",
    operatorCode: result.data.operator.trim(),
    circleCode: result.data.circle.trim(),
  };
};
