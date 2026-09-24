const {
  buildMobiKwikPaymentPayload,
} = require("../../mobikwikServices/MobikwikPayBillPayloadBuilder");

const {
  callMobiKwikPayment,
} = require("../../mobikwikServices/mobikwikPaymentService");

const callMobiKwik = async ({
  order,
  vendor,
  operatorVendor,
  attempt,
}) => {
  console.log("\n========================================");
  console.log("[MOBIKWIK] callMobiKwik() HIT");
  console.log("========================================");
  console.log("[MOBIKWIK] Order ID:", order?.id);
  console.log("[MOBIKWIK] Vendor ID:", vendor?.id);
  console.log("[MOBIKWIK] Vendor Name:", vendor?.name);
  console.log("[MOBIKWIK] Attempt ID:", attempt?.id);

  try {
    if (!order) {
      const error = new Error("Order is required");
      error.code = "ORDER_REQUIRED";
      throw error;
    }

    if (!vendor) {
      const error = new Error("Vendor is required");
      error.code = "VENDOR_REQUIRED";
      throw error;
    }

    if (!operatorVendor) {
      const error = new Error("Operator vendor mapping is required");
      error.code = "OPERATOR_VENDOR_REQUIRED";
      throw error;
    }

    if (!attempt) {
      const error = new Error("Vendor attempt is required");
      error.code = "VENDOR_ATTEMPT_REQUIRED";
      throw error;
    }

    const operatorId = order.operatorId;
    const fields = order.fields;

    const serviceName = String(order.service?.name || "").trim();

    const cirId =
      serviceName === "Prepaid"
        ? order.circleId
        : null;

    const billAmount = Number(order.amount);
    const billnetamount = Number(order.amount);

    const customerMobile = order.user?.mobileNo;

    const paymentRefID = order.id;
    const reqid = order.id;

    console.log("[MOBIKWIK] Service Name:", serviceName);
    console.log("[MOBIKWIK] Operator ID:", operatorId);
    console.log("[MOBIKWIK] Circle ID:", cirId);
    console.log("[MOBIKWIK] Bill Amount:", billAmount);
    console.log("[MOBIKWIK] Customer Mobile:", customerMobile);
    console.log("[MOBIKWIK] Payment Ref ID:", paymentRefID);

    if (!operatorId) {
      const error = new Error("Operator ID is required");
      error.code = "OPERATOR_ID_REQUIRED";
      throw error;
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      const error = new Error("Order fields are required");
      error.code = "ORDER_FIELDS_REQUIRED";
      throw error;
    }

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      const error = new Error("Invalid bill amount");
      error.code = "INVALID_BILL_AMOUNT";
      throw error;
    }

    if (!customerMobile) {
      const error = new Error("Customer mobile number is required");
      error.code = "CUSTOMER_MOBILE_REQUIRED";
      throw error;
    }

    // --------------------------------------------------
    // STEP 1: BUILD PAYLOAD
    // --------------------------------------------------

    console.log("\n[MOBIKWIK] STEP 1");
    console.log("[MOBIKWIK] Calling buildMobiKwikPaymentPayload()...");

    const encryptedPayload =
      await buildMobiKwikPaymentPayload({
        operatorId,
        fields,
        cirId,
        billAmount,
        billnetamount,
        customerMobile,
        paymentRefID,
        reqid,
      });

    console.log(
      "[MOBIKWIK] Payload builder completed successfully"
    );

    console.log(
      "[MOBIKWIK] Encrypted payload generated:",
      !!encryptedPayload
    );

    if (!encryptedPayload) {
      const error = new Error(
        "MobiKwik encrypted payload is empty"
      );
      error.code = "MOBIKWIK_ENCRYPTED_PAYLOAD_EMPTY";
      throw error;
    }

    // --------------------------------------------------
    // STEP 2: CALL MOBIKWIK SERVICE
    // --------------------------------------------------

    console.log("\n[MOBIKWIK] STEP 2");
    console.log(
      "[MOBIKWIK] Calling callMobiKwikPayment()..."
    );

    const response = await callMobiKwikPayment({
      encryptedPayload,
    });

    console.log(
      "[MOBIKWIK] callMobiKwikPayment() RESPONSE RECEIVED"
    );

    console.log(
      "[MOBIKWIK] Response:",
      JSON.stringify(response, null, 2)
    );

    // --------------------------------------------------
    // STEP 3: VALIDATE RESPONSE
    // --------------------------------------------------

    console.log("\n[MOBIKWIK] STEP 3");
    console.log("[MOBIKWIK] Processing vendor response...");

    if (response?.success === false) {
      console.log(
        "[MOBIKWIK] Service returned success=false"
      );

      return {
        status: "FAILED",
        vendorTransactionId: null,
        message:
          response?.message ||
          "MobiKwik payment service failed",
        rawResponse: response,
      };
    }

    if (!response?.success || !response?.data) {
      const error = new Error(
        "Invalid MobiKwik response"
      );
      error.code = "INVALID_MOBIKWIK_RESPONSE";
      throw error;
    }

    const vendorStatus = String(
      response.data.status || ""
    ).toUpperCase();

    console.log(
      "[MOBIKWIK] Vendor Status:",
      vendorStatus
    );

    const vendorTransactionId =
      response.data.txId ||
      response.data.transactionId ||
      null;

    console.log(
      "[MOBIKWIK] Vendor Transaction ID:",
      vendorTransactionId
    );

    if (vendorStatus === "SUCCESS") {
      console.log(
        "[MOBIKWIK] FINAL RESULT: SUCCESS"
      );

      return {
        status: "SUCCESS",
        vendorTransactionId,
        message:
          response.data.message ||
          "MobiKwik recharge successful",
        rawResponse: response,
      };
    }

    if (vendorStatus === "SUCCESSPENDING") {
      console.log(
        "[MOBIKWIK] FINAL RESULT: PENDING"
      );

      return {
        status: "PENDING",
        vendorTransactionId:
          vendorTransactionId === "Init"
            ? null
            : vendorTransactionId,
        message:
          response.data.message ||
          "MobiKwik recharge is pending",
        rawResponse: response,
      };
    }

    console.log(
      "[MOBIKWIK] FINAL RESULT: FAILED"
    );

    return {
      status: "FAILED",
      vendorTransactionId,
      message:
        response.data.message ||
        "MobiKwik recharge failed",
      rawResponse: response,
    };
  } catch (error) {
    console.log("\n========================================");
    console.log("[MOBIKWIK] ERROR");
    console.log("========================================");
    console.log("[MOBIKWIK] Error Code:", error.code);
    console.log("[MOBIKWIK] Error Message:", error.message);
    console.log("[MOBIKWIK] Order ID:", order?.id);
    console.log("========================================\n");

    throw error;
  }
};

module.exports = callMobiKwik;