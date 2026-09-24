const RechargeVendorAttempt = require(
  "../../../models/VendorAttemptModels/vendorAttempts"
);

const processVendorResponse = async ({
  order,
  vendor,
  attempt,
  vendorResult,
}) => {
  /*
   * --------------------------------------------------
   * 1. Basic Validation
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");

    error.message = "Order is required";
    error.debugMessage = "error from processVendorResponse.js";
    error.code = "ORDER_REQUIRED";

    throw error;
  }

  if (!vendor) {
    const error = new Error("Vendor is required");

    error.message = "Vendor is required";
    error.debugMessage = "error from processVendorResponse.js";
    error.code = "VENDOR_REQUIRED";

    throw error;
  }

  if (!attempt) {
    const error = new Error("Vendor attempt is required");

    error.message = "Vendor attempt is required";
    error.debugMessage = "error from processVendorResponse.js";
    error.code = "VENDOR_ATTEMPT_REQUIRED";

    throw error;
  }

  if (!vendorResult) {
    const error = new Error("Vendor result is required");

    error.message = "Vendor result is required";
    error.debugMessage = "error from processVendorResponse.js";
    error.code = "VENDOR_RESULT_REQUIRED";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 2. Validate Vendor Result Status
   * --------------------------------------------------
   */

  const status = String(
    vendorResult.status || ""
  ).toUpperCase();

  const allowedStatuses = [
    "SUCCESS",
    "FAILED",
    "PENDING",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      `Invalid vendor response status: ${vendorResult.status}`
    );

    error.message =
      `Invalid vendor response status: ${vendorResult.status}`;

    error.debugMessage =
      "error from processVendorResponse.js";

    error.code = "INVALID_VENDOR_RESPONSE_STATUS";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 3. Prepare Update Data
   * --------------------------------------------------
   */

  const updateData = {
    status,

    vendorTransactionId:
      vendorResult.vendorTransactionId || null,

    message:
      vendorResult.message || null,

    rawResponse:
      vendorResult.rawResponse || null,
  };

  /*
   * IMPORTANT:
   *
   * callbackReceived aur callbackAt yahan update
   * nahi karenge.
   *
   * Ye fields sirf actual vendor callback/webhook
   * aane par callback route update karega.
   */

  /*
   * --------------------------------------------------
   * 4. Update Vendor Attempt
   * --------------------------------------------------
   */

  try {
    await attempt.update(updateData);

  } catch (error) {
    const processError = new Error(
      "Failed to update recharge vendor attempt"
    );

    processError.message =
      "Failed to update recharge vendor attempt";

    processError.debugMessage =
      "error from processVendorResponse.js";

    processError.code =
      "VENDOR_ATTEMPT_UPDATE_FAILED";

    processError.cause = error;

    throw processError;
  }

  /*
   * --------------------------------------------------
   * 5. Return Normalized Processing Result
   * --------------------------------------------------
   */

  return {
    success: true,

    orderId: order.id,

    vendorId: vendor.id,

    attemptId: attempt.id,

    status,

    vendorTransactionId:
      vendorResult.vendorTransactionId || null,

    message:
      vendorResult.message || null,

    rawResponse:
      vendorResult.rawResponse || null,

    provider:
      vendorResult.provider ||
      vendor.name ||
      null,
  };
};

module.exports = {
  processVendorResponse,
};