const callMobiKwik = require("./callMobiKwik");
const callA1 = require("./callA1");
const callRechargeExchange = require("./callRechargeExchange");
const callRoboticsExchange = require("./callRoboticsExchange");

const callRechargeVendor = async ({
  order,
  vendor,
  operatorVendor,
  attempt,
}) => {
  console.log("\n========================================");
  console.log("[CALL RECHARGE VENDOR] FUNCTION HIT");
  console.log("========================================");
  console.log("[CALL RECHARGE VENDOR] Order ID:", order?.id);
  console.log("[CALL RECHARGE VENDOR] Vendor ID:", vendor?.id);
  console.log("[CALL RECHARGE VENDOR] Vendor Name:", vendor?.name);
  console.log("[CALL RECHARGE VENDOR] Attempt ID:", attempt?.id);
  console.log(
    "[CALL RECHARGE VENDOR] Operator Vendor ID:",
    operatorVendor?.id
  );
  console.log("========================================\n");

  if (!order) {
    const error = new Error("Order is required");

    error.code = "ORDER_REQUIRED";
    error.message = "Order is required";
    error.debugMessage = "error from callRechargeVendor.js";

    throw error;
  }

  if (!vendor) {
    const error = new Error("Vendor is required");

    error.code = "VENDOR_REQUIRED";
    error.message = "Vendor is required";
    error.debugMessage = "error from callRechargeVendor.js";

    throw error;
  }

  if (!operatorVendor) {
    const error = new Error(
      "Operator vendor mapping is required"
    );

    error.code = "OPERATOR_VENDOR_MAPPING_REQUIRED";
    error.message = "Operator vendor mapping is required";
    error.debugMessage = "error from callRechargeVendor.js";

    throw error;
  }

  if (!attempt) {
    const error = new Error("Vendor attempt is required");

    error.code = "VENDOR_ATTEMPT_REQUIRED";
    error.message = "Vendor attempt is required";
    error.debugMessage = "error from callRechargeVendor.js";

    throw error;
  }

  const vendorName = String(vendor.name || "")
    .trim()
    .toUpperCase();

  console.log(
    "[CALL RECHARGE VENDOR] Normalized Vendor Name:",
    vendorName
  );

  if (!vendorName) {
    const error = new Error("Vendor name is required");

    error.code = "VENDOR_NAME_REQUIRED";
    error.message = "Vendor name is required";
    error.debugMessage = "error from callRechargeVendor.js";

    throw error;
  }

  try {
    switch (vendorName) {
      // ============================================
      // MOBIKWIK
      // ============================================
      case "MOBIKWIK":

        console.log(
          "\n[CALL RECHARGE VENDOR] >>> MOBIKWIK CASE HIT"
        );

        console.log(
          "[CALL RECHARGE VENDOR] Calling callMobiKwik()..."
        );

        const mobiKwikResult = await callMobiKwik({
          order,
          vendor,
          operatorVendor,
          attempt,
        });

        console.log(
          "[CALL RECHARGE VENDOR] <<< callMobiKwik() RESPONSE RECEIVED"
        );

        console.log(
          "[CALL RECHARGE VENDOR] MobiKwik Status:",
          mobiKwikResult?.status
        );

        return mobiKwikResult;

      // ============================================
      // A1
      // ============================================
      case "A1":
      case "A1 TOPUP":

        console.log(
          "\n[CALL RECHARGE VENDOR] >>> A1 CASE HIT"
        );

        console.log(
          "[CALL RECHARGE VENDOR] Calling callA1()..."
        );

        const a1Result = await callA1({
          order,
          vendor,
          operatorVendor,
          attempt,
        });

        console.log(
          "[CALL RECHARGE VENDOR] <<< callA1() RESPONSE RECEIVED"
        );

        console.log(
          "[CALL RECHARGE VENDOR] A1 Status:",
          a1Result?.status
        );

        return a1Result;

      // ============================================
      // RECHARGE EXCHANGE
      // ============================================
      case "RECHARGEEXCHANGE":
      case "RECHARGE EXCHANGE":

        console.log(
          "\n[CALL RECHARGE VENDOR] >>> RECHARGE EXCHANGE CASE HIT"
        );

        console.log(
          "[CALL RECHARGE VENDOR] Calling callRechargeExchange()..."
        );

        const rechargeExchangeResult =
          await callRechargeExchange({
            order,
            vendor,
            operatorVendor,
            attempt,
          });

        console.log(
          "[CALL RECHARGE VENDOR] <<< callRechargeExchange() RESPONSE RECEIVED"
        );

        console.log(
          "[CALL RECHARGE VENDOR] RechargeExchange Status:",
          rechargeExchangeResult?.status
        );

        return rechargeExchangeResult;

      // ============================================
      // ROBOTICS EXCHANGE
      // ============================================
      case "ROBOTICSEXCHANGE":
      case "ROBOTICS EXCHANGE":

        console.log(
          "\n[CALL RECHARGE VENDOR] >>> ROBOTICS EXCHANGE CASE HIT"
        );

        console.log(
          "[CALL RECHARGE VENDOR] Calling callRoboticsExchange()..."
        );

        const roboticsResult = await callRoboticsExchange({
          order,
          vendor,
          operatorVendor,
          attempt,
        });

        console.log(
          "[CALL RECHARGE VENDOR] <<< callRoboticsExchange() RESPONSE RECEIVED"
        );

        console.log(
          "[CALL RECHARGE VENDOR] Robotics Status:",
          roboticsResult?.status
        );

        return roboticsResult;

      // ============================================
      // UNSUPPORTED
      // ============================================
      default: {
        console.log(
          "[CALL RECHARGE VENDOR] UNSUPPORTED VENDOR:",
          vendor.name
        );

        const error = new Error(
          `Unsupported recharge vendor: ${vendor.name}`
        );

        error.code = "UNSUPPORTED_RECHARGE_VENDOR";
        error.message = `Unsupported recharge vendor: ${vendor.name}`;
        error.debugMessage = "error from callRechargeVendor.js";

        throw error;
      }
    }
  } catch (error) {
    console.log("\n========================================");
    console.log("[CALL RECHARGE VENDOR] ERROR");
    console.log("========================================");
    console.log(
      "[CALL RECHARGE VENDOR] Order ID:",
      order?.id
    );
    console.log(
      "[CALL RECHARGE VENDOR] Vendor:",
      vendor?.name
    );
    console.log(
      "[CALL RECHARGE VENDOR] Error Code:",
      error.code || "UNKNOWN_ERROR"
    );
    console.log(
      "[CALL RECHARGE VENDOR] Error Message:",
      error.message
    );
    console.log("========================================\n");

    throw error;
  }
};

module.exports = {
  callRechargeVendor,
};