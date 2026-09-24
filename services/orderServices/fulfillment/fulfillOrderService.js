const {
  getOrderForFulfillment,
} = require("./getOrderForFulfillment");

const {
  validateOrderForFulfillment,
} = require("./validateOrderForFulfillment");

const {
  processWalletDebit,
} = require("./processWalletDebit");

const {
  determineVendorSequence,
} = require("./determineVendorSequence");

const {
  createVendorAttempt,
} = require("./createVendorAttempt");

const {
  callRechargeVendor,
} = require("./callRechargeVendor");

const {
  processVendorResponse,
} = require("./processVendorResponse");

const {
  updateOrderStatus,
} = require("./updateOrderStatus");

const {
  updateTransactionHistory,
} = require("./updateTransactionHistory");

const {
  refundWallet,
} = require("./refundWallet");

const {
  markOrderFailed,
} = require("./markOrderFailed");


const fulfillOrderService = async ({
  orderId,
}) => {

  console.log("\n");
  console.log("==================================================");
  console.log("[FULFILL] fulfillOrderService() START");
  console.log("==================================================");
  console.log("[FULFILL] Order ID:", orderId);
  console.log("==================================================");


  /*
   * ==================================================
   * 1. BASIC VALIDATION
   * ==================================================
   */

  console.log("[FULFILL] STEP 1 - Basic validation");

  if (!orderId) {
    const error = new Error("Order ID is required");
    error.code = "ORDER_ID_REQUIRED";
    error.message = "Order ID is required";
    error.debugMessage = "error from fullfillOrderService.js";

    console.log("[FULFILL] ERROR - Order ID missing");

    throw error;
  }

  console.log("[FULFILL] Order ID validation passed");


  /*
   * ==================================================
   * 2. GET ORDER
   * ==================================================
   */

  console.log("\n[FULFILL] STEP 2 - Getting order");

  let order = await getOrderForFulfillment(orderId);

  console.log("[FULFILL] Order fetched:", !!order);

  if (order) {
    console.log("[FULFILL] Order ID:", order.id);
    console.log("[FULFILL] Order Status:", order.status);
    console.log("[FULFILL] Payment Method:", order.paymentMethod);
    console.log("[FULFILL] Service:", order.service?.name);
    console.log("[FULFILL] Operator ID:", order.operatorId);
  }


  /*
   * ==================================================
   * 3. VALIDATE ORDER
   * ==================================================
   */

  console.log("\n[FULFILL] STEP 3 - Validating order");

  await validateOrderForFulfillment(order);

  console.log("[FULFILL] Order validation passed");


  /*
   * ==================================================
   * 4. WALLET DEBIT + PROCESSING
   * ==================================================
   */

  console.log("\n[FULFILL] STEP 4 - Processing wallet debit");



  const walletDebitResult =
    await processWalletDebit(order);

  console.log(
    "[FULFILL] processWalletDebit completed"
  );

  console.log(
    "[FULFILL] Wallet Debited:",
    walletDebitResult?.walletDebited
  );

  console.log(
    "[FULFILL] Wallet Transaction ID:",
    walletDebitResult?.walletTransactionId
  );

  console.log(
    "[FULFILL] Wallet Amount:",
    walletDebitResult?.walletAmount
  );




  /*
   * ==================================================
   * 5. RELOAD LATEST ORDER
   * ==================================================
   */

  console.log(
    "\n[FULFILL] STEP 5 - Reloading latest order"
  );

  order =
    await getOrderForFulfillment(orderId);

  console.log(
    "[FULFILL] Latest order status:",
    order?.status
  );


  /*
   * ==================================================
   * 6. VENDOR PROCESSING LOOP
   * ==================================================
   */

  console.log(
    "\n=================================================="
  );

  console.log(
    "[FULFILL] STEP 6 - START VENDOR PROCESSING LOOP"
  );

  console.log(
    "=================================================="
  );


  while (true) {

    console.log(
      "\n------------------------------------------"
    );

    console.log(
      "[FULFILL] NEW VENDOR LOOP ITERATION"
    );

    console.log(
      "[FULFILL] Order ID:",
      order.id
    );

    console.log(
      "[FULFILL] Current Order Status:",
      order.status
    );

    console.log(
      "------------------------------------------"
    );


    /*
     * ------------------------------------------------
     * 6.1 Determine Vendor
     * ------------------------------------------------
     */

    console.log(
      "\n[FULFILL] STEP 6.1 - Determining vendor"
    );

    const vendorDecision =
      await determineVendorSequence(order);


    console.log(
      "\n[FULFILL] ===== VENDOR DECISION ====="
    );

    console.log(
      "[FULFILL] alreadySuccessful:",
      vendorDecision?.alreadySuccessful
    );

    console.log(
      "[FULFILL] waitingForVendor:",
      vendorDecision?.waitingForVendor
    );

    console.log(
      "[FULFILL] allVendorsFailed:",
      vendorDecision?.allVendorsFailed
    );

    console.log(
      "[FULFILL] nextVendor exists:",
      !!vendorDecision?.nextVendor
    );

    console.log(
      "[FULFILL] nextVendor name:",
      vendorDecision?.nextVendor?.vendor?.name
    );

    console.log(
      "[FULFILL] nextVendor ID:",
      vendorDecision?.nextVendor?.vendor?.id
    );

    console.log(
      "[FULFILL] nextVendor operatorVendor ID:",
      vendorDecision?.nextVendor?.operatorVendor?.id
    );

    console.log(
      "[FULFILL] nextVendor attempt ID:",
      vendorDecision?.nextVendor?.attempt?.id
    );

    console.log(
      "[FULFILL] nextVendor attempt status:",
      vendorDecision?.nextVendor?.attempt?.status
    );

    console.log(
      "[FULFILL] =============================\n"
    );


    /*
     * ------------------------------------------------
     * 6.2 Already Successful
     * ------------------------------------------------
     */

    if (
      vendorDecision.alreadySuccessful
    ) {

      console.log(
        "[FULFILL] BRANCH: alreadySuccessful"
      );

      console.log(
        "[FULFILL] No vendor API call will happen"
      );

      await updateOrderStatus({
        order,
        vendorStatus: "SUCCESS",
      });

      await updateTransactionHistory({
        order,
        status: "SUCCESS",
      });

      return {
        success: true,
        orderId,
        status: "SUCCESS",
        vendor:
          vendorDecision.vendor ||
          vendorDecision.nextVendor?.vendor ||
          null,
        attempt:
          vendorDecision.attempt ||
          vendorDecision.nextVendor?.attempt ||
          null,
        duplicateRequest: true,
      };
    }


    /*
     * ------------------------------------------------
     * 6.3 Existing Pending Vendor
     * ------------------------------------------------
     */

    if (
      vendorDecision.waitingForVendor
    ) {

      console.log(
        "[FULFILL] BRANCH: waitingForVendor"
      );

      console.log(
        "[FULFILL] Existing vendor attempt is PENDING"
      );

      console.log(
        "[FULFILL] Vendor API will NOT be called"
      );

      await updateOrderStatus({
        order,
        vendorStatus: "PENDING",
      });

      await updateTransactionHistory({
        order,
        status: "PENDING",
      });

      return {
        success: true,
        orderId,
        status: "PENDING",
        vendor:
          vendorDecision.vendor ||
          vendorDecision.nextVendor?.vendor ||
          null,
        attempt:
          vendorDecision.attempt ||
          vendorDecision.nextVendor?.attempt ||
          null,
      };
    }


    /*
     * ------------------------------------------------
     * 6.4 ALL VENDORS FAILED
     * ------------------------------------------------
     */

    if (
      vendorDecision.allVendorsFailed
    ) {

      console.log(
        "[FULFILL] BRANCH: allVendorsFailed"
      );

      console.log(
        "[FULFILL] No vendor API call will happen"
      );


      const refundResult =
        await refundWallet({
          order,
        });


      await markOrderFailed({
        order,
      });


      await updateTransactionHistory({
        order,
        status: "FAILED",
      });

      return {
        success: false,
        orderId,
        status: "FAILED",
        reason:
          "ALL_VENDORS_FAILED",
        refund:
          refundResult,
      };
    }


    /*
     * ------------------------------------------------
     * 6.5 Selected Vendor
     * ------------------------------------------------
     */

    console.log(
      "\n[FULFILL] STEP 6.5 - Getting selected vendor"
    );

    const nextVendor =
      vendorDecision.nextVendor;

    if (!nextVendor) {

      console.log(
        "[FULFILL] ERROR: No vendor selected"
      );

      const error = new Error(
        "No vendor selected for order fulfillment"
      );

      error.code = "VENDOR_NOT_SELECTED";
      error.message = "No vendor selected for order fulfillment";
      error.debugMessage = "error from fulfillOrderService.js"


      throw error;
    }


    const vendor =
      nextVendor.vendor;

    const operatorVendor =
      nextVendor.operatorVendor;


    console.log(
      "[FULFILL] Selected Vendor:",
      vendor?.name
    );

    console.log(
      "[FULFILL] Selected Vendor ID:",
      vendor?.id
    );

    console.log(
      "[FULFILL] Operator Vendor Mapping ID:",
      operatorVendor?.id
    );

    console.log(
      "[FULFILL] Vendor Operator Code:",
      operatorVendor?.vendorOperatorCode
    );


    /*
     * ------------------------------------------------
     * 6.6 Existing Attempt From Decision
     * ------------------------------------------------
     */

    let attempt =
      nextVendor.attempt ||
      null;

    /*
     * IMPORTANT:
     *
     * true  = attempt abhi isi request me create hua
     * false = attempt pehle se database me exist karta tha
     *
     * Newly created attempt ka status PENDING hota hai,
     * lekin usko vendor API call se rokna nahi hai.
     */

    let attemptCreatedNow = false;


    console.log(
      "[FULFILL] Existing Attempt ID:",
      attempt?.id || "NONE"
    );

    console.log(
      "[FULFILL] Existing Attempt Status:",
      attempt?.status || "NONE"
    );


    /*
     * ------------------------------------------------
     * 6.7 Create Vendor Attempt
     * ------------------------------------------------
     */

    if (!attempt) {

      console.log(
        "\n[FULFILL] No existing attempt"
      );

      console.log(
        "[FULFILL] Creating vendor attempt..."
      );

      const attemptResult =
        await createVendorAttempt({
          orderId:
            order.id,

          vendorId:
            vendor.id,
        });


      attempt =
        attemptResult.attempt;


      /*
       * IMPORTANT:
       *
       * Sirf newly created attempt ko identify kar rahe hain.
       */

      if (
        attemptResult.created === true
      ) {
        attemptCreatedNow = true;
      }


      console.log(
        "[FULFILL] Vendor attempt creation result:"
      );

      console.log(
        "[FULFILL] created:",
        attemptResult.created
      );

      console.log(
        "[FULFILL] alreadyExists:",
        attemptResult.alreadyExists
      );

      console.log(
        "[FULFILL] Attempt ID:",
        attempt?.id
      );

      console.log(
        "[FULFILL] Attempt Status:",
        attempt?.status
      );

      console.log(
        "[FULFILL] Attempt Created Now:",
        attemptCreatedNow
      );


      if (!attempt) {

        const error = new Error(
          "Vendor attempt could not be created"
        );

        error.code =
          "VENDOR_ATTEMPT_NOT_AVAILABLE";
        error.message = "Vendor attempt could not be created";
        error.debugMessage = "error fromFulfillOrderService.js"

        throw error;
      }


      /*
       * ------------------------------------------------
       * Race condition protection
       * ------------------------------------------------
       */

      if (
        !attemptResult.created
      ) {

        console.log(
          "[FULFILL] Existing attempt found during creation"
        );

        console.log(
          "[FULFILL] Existing Attempt Status:",
          attempt.status
        );


        if (
          attempt.status ===
          "SUCCESS"
        ) {

          console.log(
            "[FULFILL] Existing attempt is SUCCESS"
          );

          await updateOrderStatus({
            order,
            vendorStatus:
              "SUCCESS",
          });

          await updateTransactionHistory({
            order,
            status:
              "SUCCESS",
          });

          return {
            success: true,
            orderId,
            status: "SUCCESS",
            vendor,
            attemptId:
              attempt.id,
            duplicateRequest: true,
          };
        }


        if (
          attempt.status ===
          "PENDING"
        ) {

          console.log(
            "[FULFILL] Existing attempt is PENDING"
          );

          console.log(
            "[FULFILL] Vendor API will NOT be called"
          );

          await updateOrderStatus({
            order,
            vendorStatus:
              "PENDING",
          });

          await updateTransactionHistory({
            order,
            status:
              "PENDING",
          });

          return {
            success: true,
            orderId,
            status: "PENDING",
            vendor,
            attemptId:
              attempt.id,
            duplicateRequest: true,
          };
        }


        if (
          attempt.status ===
          "FAILED"
        ) {

          console.log(
            "[FULFILL] Existing attempt is FAILED"
          );

          console.log(
            "[FULFILL] Continuing loop for next vendor"
          );

          continue;
        }
      }
    }


    /*
     * ------------------------------------------------
     * 6.8 Safety Check
     * ------------------------------------------------
     *
     * IMPORTANT FIX:
     *
     * Newly created attempt ka initial status PENDING
     * hota hai.
     *
     * Isliye:
     *
     * attempt.status === PENDING
     * &&
     * attemptCreatedNow === false
     *
     * hone par hi vendor API ko block karenge.
     *
     * Agar attempt abhi create hua hai:
     *
     * attemptCreatedNow === true
     *
     * to vendor API call hoga.
     */

    console.log(
      "\n[FULFILL] STEP 6.8 - Safety check"
    );

    console.log(
      "[FULFILL] Attempt ID:",
      attempt?.id
    );

    console.log(
      "[FULFILL] Attempt Status:",
      attempt?.status
    );

    console.log(
      "[FULFILL] Attempt Created Now:",
      attemptCreatedNow
    );


    /*
     * Existing SUCCESS
     */

    if (
      attempt.status ===
      "SUCCESS"
    ) {

      console.log(
        "[FULFILL] Safety branch: attempt SUCCESS"
      );

      await updateOrderStatus({
        order,
        vendorStatus:
          "SUCCESS",
      });

      await updateTransactionHistory({
        order,
        status:
          "SUCCESS",
      });

      return {
        success: true,
        orderId,
        status: "SUCCESS",
        vendor,
        attemptId:
          attempt.id,
      };
    }


    /*
     * Existing PENDING
     *
     * IMPORTANT:
     * Newly created PENDING attempt ko yahan
     * stop nahi karna hai.
     */

    if (
      attempt.status ===
      "PENDING" &&
      !attemptCreatedNow
    ) {

      console.log(
        "[FULFILL] Safety branch: EXISTING attempt PENDING"
      );

      console.log(
        "[FULFILL] Vendor API will NOT be called"
      );

      await updateOrderStatus({
        order,
        vendorStatus:
          "PENDING",
      });

      await updateTransactionHistory({
        order,
        status:
          "PENDING",
      });

      return {
        success: true,
        orderId,
        status: "PENDING",
        vendor,
        attemptId:
          attempt.id,
      };
    }


    /*
     * Newly created PENDING attempt
     *
     * Yahan se vendor API call hoga.
     */

    if (
      attempt.status ===
      "PENDING" &&
      attemptCreatedNow
    ) {

      console.log(
        "[FULFILL] Newly created attempt is PENDING"
      );

      console.log(
        "[FULFILL] This is expected."
      );

      console.log(
        "[FULFILL] Vendor API call WILL CONTINUE."
      );
    }


    /*
     * ==================================================
     * 7. CALL VENDOR
     * ==================================================
     */

    console.log("\n");

    console.log(
      "=================================================="
    );

    console.log(
      "[FULFILL] STEP 7 - CALLING RECHARGE VENDOR"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "[FULFILL] Order ID:",
      order?.id
    );

    console.log(
      "[FULFILL] Vendor:",
      vendor?.name
    );

    console.log(
      "[FULFILL] Vendor ID:",
      vendor?.id
    );

    console.log(
      "[FULFILL] Operator Vendor ID:",
      operatorVendor?.id
    );

    console.log(
      "[FULFILL] Attempt ID:",
      attempt?.id
    );

    console.log(
      "[FULFILL] Attempt Status:",
      attempt?.status
    );

    console.log(
      "[FULFILL] Attempt Created Now:",
      attemptCreatedNow
    );

    console.log(
      "[FULFILL] >>> ABOUT TO CALL callRechargeVendor() <<<"
    );


    let vendorResult;

    vendorResult =
      await callRechargeVendor({
        order,
        vendor,
        operatorVendor,
        attempt,
      });



    /*
     * ==================================================
     * 8. PROCESS VENDOR RESPONSE
     * ==================================================
     */

    console.log(
      "\n[FULFILL] STEP 8 - Processing vendor response"
    );

    const processedResult =
      await processVendorResponse({
        order,
        vendor,
        attempt,
        vendorResult,
      });


    console.log(
      "[FULFILL] Processed Vendor Status:",
      processedResult?.status
    );

    console.log(
      "[FULFILL] Processed Vendor Transaction ID:",
      processedResult?.vendorTransactionId
    );


    /*
     * ==================================================
     * 9. VENDOR SUCCESS
     * ==================================================
     */

    if (
      processedResult.status ===
      "SUCCESS"
    ) {

      console.log(
        "[FULFILL] Vendor SUCCESS"
      );

      await updateOrderStatus({
        order,
        vendorStatus:
          "SUCCESS",
      });

      await updateTransactionHistory({
        order,
        status:
          "SUCCESS",
      });

      return {
        success: true,
        orderId,
        status: "SUCCESS",
        vendor,
        attemptId:
          attempt.id,
        vendorTransactionId:
          processedResult.vendorTransactionId ||
          null,
      };
    }


    /*
     * ==================================================
     * 10. VENDOR PENDING
     * ==================================================
     */

    if (
      processedResult.status ===
      "PENDING"
    ) {

      console.log(
        "[FULFILL] Vendor returned PENDING"
      );

      await updateOrderStatus({
        order,
        vendorStatus:
          "PENDING",
      });

      await updateTransactionHistory({
        order,
        status:
          "PENDING",
      });

      return {
        success: true,
        orderId,
        status: "PENDING",
        vendor,
        attemptId:
          attempt.id,
        vendorTransactionId:
          processedResult.vendorTransactionId ||
          null,
      };
    }


    /*
     * ==================================================
     * 11. VENDOR FAILED
     * ==================================================
     */

    if (
      processedResult.status ===
      "FAILED"
    ) {

      console.log(
        "[FULFILL] Vendor FAILED"
      );


      /*
       * Order PROCESSING hi rahega.
       */

      await updateOrderStatus({
        order,
        vendorStatus:
          "FAILED",
      });

      await updateTransactionHistory({
        order,
        status:
          "PROCESSING",
      });


      console.log(
        "[FULFILL] Vendor FAILED."
      );

      console.log(
        "[FULFILL] Continuing loop for next vendor..."
      );

      continue;
    }
  }
};


module.exports = {
  fulfillOrderService,
};