const { UniqueConstraintError } = require("sequelize");

const RechargeVendorAttempt = require(
  "../../../models/VendorAttemptModels/vendorAttempts"
);

const uidgenerate = require("../../../util/uidGenerator");

const createVendorAttempt = async ({
  orderId,
  vendorId,
  transaction = null,
}) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */

  if (!orderId) {
    const error = new Error("Order ID is required");

    error.message = "OrderId is required";
    error.debugMessage = "error from createVendorAttempt.js";
    error.code = "ORDER_ID_REQUIRED";

    throw error;
  }

  if (!vendorId) {
    const error = new Error("Vendor ID is required");

    error.message = "Vendor ID is required";
    error.debugMessage = "error from createVendorAttempt.js";
    error.code = "VENDOR_ID_REQUIRED";

    throw error;
  }


  /*
   * --------------------------------------------------
   * 2. EXISTING ATTEMPT CHECK
   * --------------------------------------------------
   *
   * This makes the function idempotent during
   * normal execution.
   *
   * One order + one vendor can have only one attempt.
   */

  const existingAttempt = await RechargeVendorAttempt.findOne({
    where: {
      orderId,
      vendorId,
    },
    transaction,
  });

  if (existingAttempt) {
    return {
      created: false,
      alreadyExists: true,
      attempt: existingAttempt,
    };
  }


  /*
   * --------------------------------------------------
   * 3. CREATE NEW VENDOR ATTEMPT
   * --------------------------------------------------
   */

  try {
    const attempt = await RechargeVendorAttempt.create(
      {
        id: await uidgenerate(),

        orderId,

        vendorId,

        vendorTransactionId: null,

        status: "PENDING",

        message: null,

        rawResponse: null,

        callbackReceived: false,

        callbackAt: null,
      },
      {
        transaction,
      }
    );

    return {
      created: true,
      alreadyExists: false,
      attempt,
    };

  } catch (error) {

    /*
     * --------------------------------------------------
     * 4. DUPLICATE ATTEMPT / RACE CONDITION
     * --------------------------------------------------
     *
     * Possible situation:
     *
     * Request A -> findOne() -> no attempt
     * Request B -> findOne() -> no attempt
     *
     * Request A -> create() -> SUCCESS
     * Request B -> create() -> UNIQUE CONSTRAINT ERROR
     *
     * The unique constraint on:
     *
     * (orderId, vendorId)
     *
     * protects the database.
     */

    if (error instanceof UniqueConstraintError) {

      const existingAttempt =
        await RechargeVendorAttempt.findOne({
          where: {
            orderId,
            vendorId,
          },
          transaction,
        });

      /*
       * The unique constraint error should mean that
       * another request created the attempt.
       *
       * If it still cannot be found, throw the original
       * error instead of returning an invalid result.
       */

      if (!existingAttempt) {
        throw error;
      }

      return {
        created: false,
        alreadyExists: true,
        attempt: existingAttempt,
      };
    }

    /*
     * --------------------------------------------------
     * 5. UNEXPECTED ERROR
     * --------------------------------------------------
     */

    throw error;
  }
};


module.exports = {
  createVendorAttempt,
};