
const operatorLookupService = require("./operatorLookupService");
const operatorMappingService = require("./operatorMappingService");
const rechargePlanProviderService = require("./rechargePlanProviderService");

exports.getRechargePlans = async (mobileNo) => {
  // --------------------------------
  // 1. Validate mobile number
  // --------------------------------
  if (
    typeof mobileNo !== "string" ||
    !/^[6-9]\d{9}$/.test(mobileNo)
  ) {
    const error = new Error("Invalid mobile number");
    error.statusCode = 400;
    error.code = "INVALID_MOBILE_NUMBER";
    throw error;
  }

  // --------------------------------
  // 2. Lookup operator and circle
  // --------------------------------
  const lookupResult =
    await operatorLookupService.lookupOperator(mobileNo);

  if (!lookupResult) {
    const error = new Error(
      "Unable to identify mobile operator and circle"
    );
    error.statusCode = 422;
    error.code = "OPERATOR_LOOKUP_FAILED";
    throw error;
  }

  // --------------------------------
  // 3. Resolve internal operator/circle
  // --------------------------------
  const mappedData =
    await operatorMappingService.resolveOperatorAndCircle(
      lookupResult
    );

  if (!mappedData) {
    const error = new Error(
      "Operator or circle mapping not found"
    );
    error.statusCode = 422;
    error.code = "INTERNAL_MAPPING_NOT_FOUND";
    throw error;
  }

  // --------------------------------
  // 4. Fetch MobiKwik recharge plans
  // --------------------------------
  const planResult =
    await rechargePlanProviderService.fetchPlans(
      mappedData.operator.id,
      mappedData.circle.id
    );

  if (!planResult.success) {
    const error = new Error(
      "Recharge plans are unavailable for this operator and circle"
    );
    error.statusCode = 422;
    error.code = planResult.reason;
    throw error;
  }

  // --------------------------------
  // 5. Return complete result
  // --------------------------------
  return {
    mobileNo,
    operator: mappedData.operator,
    circle: mappedData.circle,
    lookupProvider: mappedData.lookupProvider,
    planProvider: planResult.provider,
    plans: planResult.plans,
  };
};
