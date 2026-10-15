
const axios = require("axios");

const MOBIKWIK_PLANS_URL =
  "https://rapi-b2b.mobikwik.com/recharge/v1/rechargePlansAPI";

exports.fetchPlans = async (operatorCode, circleCode) => {
  if (!operatorCode || !circleCode) {
    throw new Error(
      "MobiKwik operator code and circle code are required"
    );
  }

  try {
    const response = await axios.get(
      `${MOBIKWIK_PLANS_URL}/${encodeURIComponent(operatorCode)}/${encodeURIComponent(circleCode)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-MClient": 14,
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    // Let the caller/global error handler process failures.
    throw error;
  }
};
