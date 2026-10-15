const OperatorVendorMapping = require("../../models/OperatorDataModel/OperatorVendorMapping");

const CircleVendorMapping = require("../../models/CircleDataModel/CircleVendorMapping");

const AvailableAPIs = require("../../models/APIModels/api");

const mobikwikPlanService = require("./mobikwikPlanService");

// MobiKwik vendor ID from AvailableAPIs
const MOBIKWIK_VENDOR_ID = "1";

exports.fetchPlans = async (operatorId, circleId) => {
  if (!operatorId || !circleId) {
    throw new Error("Operator ID and circle ID are required");
  }

  // --------------------------------
  // 1. Verify MobiKwik vendor
  // --------------------------------
  const vendor = await AvailableAPIs.findOne({
    where: {
      id: MOBIKWIK_VENDOR_ID,
    },
    attributes: ["id", "name"],
  });

  if (!vendor) {
    throw new Error("MobiKwik vendor configuration not found");
  }

  // --------------------------------
  // 2. Resolve MobiKwik operator code
  // --------------------------------
  const operatorMapping = await OperatorVendorMapping.findOne({
    where: {
      operatorId,
      vendorId: vendor.id,
      status: "active",
    },
    attributes: ["vendorOperatorCode"],
  });

  if (!operatorMapping) {
    return {
      success: false,
      reason: "OPERATOR_MAPPING_NOT_FOUND",
    };
  }

  // --------------------------------
  // 3. Resolve MobiKwik circle code
  // --------------------------------
  const circleMapping = await CircleVendorMapping.findOne({
    where: {
      circleId,
      vendorId: vendor.id,
      status: "active",
    },
    attributes: ["circleCode"],
  });

  if (!circleMapping) {
    return {
      success: false,
      reason: "CIRCLE_MAPPING_NOT_FOUND",
    };
  }

  // --------------------------------
  // 4. Fetch plans from MobiKwik
  // --------------------------------
  const plans = await mobikwikPlanService.fetchPlans(
    operatorMapping.vendorOperatorCode,
    circleMapping.circleCode
  );

  // --------------------------------
  // 5. Return provider result
  // --------------------------------
  return {
    success: true,
    provider: vendor.name,
    operatorCode: operatorMapping.vendorOperatorCode,
    circleCode: circleMapping.circleCode,
    plans,
  };
};
