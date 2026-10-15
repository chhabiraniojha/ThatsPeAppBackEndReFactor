
const planConnectService = require("./planConnectService");
const ezytmService = require("./ezytmService");

exports.lookupOperator = async (mobileNo) => {
  // --------------------------------
  // 1. Try PlanConnect first
  // --------------------------------
  const planConnectResult =
    await planConnectService.lookupOperator(mobileNo);

  if (planConnectResult) {
    return planConnectResult;
  }

  // --------------------------------
  // 2. Fallback to Ezytm
  // --------------------------------
  const ezytmResult =
    await ezytmService.lookupOperator(mobileNo);

  if (ezytmResult) {
    return ezytmResult;
  }

  // --------------------------------
  // 3. No usable data from either provider
  // --------------------------------
  return null;
};
