const OperatorVendorMapping = require("../../../models/OperatorDataModel/OperatorVendorMapping");
const OperatorVendorSeqMapping = require("../../../models/OperatorDataModel/OperatorVendorSeqMap");
const RechargeVendorAttempt = require("../../../models/VendorAttemptModels/vendorAttempts");
const AvailableAPIs = require("../../../models/APIModels/api");
const SubCategory = require("../../../models/SubCategoryModel/subCategory");

const SEQUENCE_SERVICES = ["Prepaid", "DTH"];

const ALLOWED_ATTEMPT_STATUSES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
];

const determineVendorSequence = async (order) => {
  /*
   * --------------------------------------------------
   * 1. BASIC VALIDATION
   * --------------------------------------------------
   */

  if (!order) {
    const error = new Error("Order is required");
    error.code = "ORDER_REQUIRED";
    error.message = "Order is required";
    error.debugMessage = "error from determineVendorSequence.js"
    throw error;
  }

  if (!order.id) {
    const error = new Error("Order ID is required");
    error.message = "OrderId is required";
    error.debugMessage = "error from determineVendorSequence.js"
    error.code = "ORDER_ID_REQUIRED";
    throw error;
  }

  if (!order.operatorId) {
    const error = new Error("Operator ID is required");
    error.code = "OPERATOR_ID_REQUIRED";
    error.message = "Operator ID is required";
    error.debugMessage = "error from determineVendorSequence.js"
    throw error;
  }

  if (!order.serviceType) {
    const error = new Error("Service type is required");
    error.code = "SERVICE_TYPE_REQUIRED";
    error.message = "Service type is required";
    error.debugMessage = "error from determineVendorSequence.js"
    throw error;
  }

  /*
   * --------------------------------------------------
   * 2. GET SUBCATEGORY
   * --------------------------------------------------
   */

  const subCategory = await SubCategory.findOne({
    where: {
      id: order.serviceType,
      status: "active",
    },
    attributes: ["id", "name", "status"],
  });

  if (!subCategory) {
    const error = new Error(
      "Active subcategory not found for this order"
    );
    error.message = "Active subcategory not found for this order";
    error.debugMessage = "error from determineVendorSequence.js"
    error.code = "SUBCATEGORY_NOT_FOUND";

    throw error;
  }

  /*
   * --------------------------------------------------
   * 3. CHECK SEQUENCE SERVICE
   * --------------------------------------------------
   *
   * Sequence is ONLY applicable for:
   *
   * 1. Prepaid
   * 2. DTH
   *
   * All other services use MOBIKWIK directly.
   */

  const isSequenceService = SEQUENCE_SERVICES.includes(
    subCategory.name
  );

  /*
   * --------------------------------------------------
   * 4. GET ACTIVE OPERATOR-VENDOR MAPPINGS
   * --------------------------------------------------
   */

  const operatorVendorMappings =
    await OperatorVendorMapping.findAll({
      where: {
        operatorId: order.operatorId,
        status: "active",
      },

      attributes: [
        "id",
        "operatorId",
        "vendorId",
        "vendorOperatorCode",
        "status",
      ],
    });

  /*
   * --------------------------------------------------
   * 5. CREATE OPERATOR-VENDOR MAP
   * --------------------------------------------------
   */

  const operatorVendorMap = new Map();

  for (const mapping of operatorVendorMappings) {
    operatorVendorMap.set(
      mapping.vendorId,
      mapping
    );
  }

  /*
   * --------------------------------------------------
   * 6. GET EXISTING VENDOR ATTEMPTS
   * --------------------------------------------------
   */

  const existingAttempts =
    await RechargeVendorAttempt.findAll({
      where: {
        orderId: order.id,
      },

      attributes: [
        "id",
        "orderId",
        "vendorId",
        "vendorTransactionId",
        "status",
        "message",
        "callbackReceived",
        "callbackAt",
        "createdAt",
        "updatedAt",
      ],
    });

  const attemptMap = new Map();

  for (const attempt of existingAttempts) {
    /*
     * Safety validation.
     *
     * Only these statuses are valid:
     * PENDING / SUCCESS / FAILED
     */

    if (
      !ALLOWED_ATTEMPT_STATUSES.includes(
        attempt.status
      )
    ) {
      const error = new Error(
        `Invalid vendor attempt status: ${attempt.status}`
      );

      error.code =
        "INVALID_VENDOR_ATTEMPT_STATUS";
      error.message = `Invalid vendor attempt status: ${attempt.status}`;
      error.debugMessage = "error from determineVendorSequence.js"

      error.orderId = order.id;
      error.vendorId = attempt.vendorId;
      error.attemptId = attempt.id;

      throw error;
    }

    attemptMap.set(
      attempt.vendorId,
      attempt
    );
  }

  /*
   * --------------------------------------------------
   * 7. NON-SEQUENCE SERVICES
   * --------------------------------------------------
   *
   * All services other than Prepaid/DTH
   * use ONLY MOBIKWIK.
   */

  if (!isSequenceService) {
    const mobikwik =
      await AvailableAPIs.findOne({
        where: {
          name: "MOBIKWIK",
          status: true,
        },

        attributes: [
          "id",
          "name",
          "url",
          "status",
        ],
      });

    if (!mobikwik) {
      const error = new Error(
        "MOBIKWIK vendor is not available"
      );

      error.code =
        "DEFAULT_VENDOR_NOT_AVAILABLE";
      error.message = "MOBIKWIK vendor is not available";
      error.debugMessage = "error from determineVendorSequence.js"

      throw error;
    }

    /*
     * MobiKwik must be mapped with operator.
     */

    const operatorVendor =
      operatorVendorMap.get(mobikwik.id);

    if (!operatorVendor) {
      const error = new Error(
        "MOBIKWIK is not mapped with this operator"
      );

      error.code =
        "DEFAULT_VENDOR_NOT_MAPPED";
      error.message = "MOBIKWIK is not mapped with this operator";
      error.debugMessage = "error from determineVendorSequence.js"

      throw error;
    }

    const existingAttempt =
      attemptMap.get(mobikwik.id);

    /*
     * No previous attempt
     *
     * Call MobiKwik.
     */

    if (!existingAttempt) {
      return {
        nextVendor: {
          vendorId: mobikwik.id,
          sequence: null,
          vendor: mobikwik,
          operatorVendor,
          attempt: null,
        },

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: false,
        isDefaultVendor: true,
      };
    }

    /*
     * MobiKwik SUCCESS
     */

    if (existingAttempt.status === "SUCCESS") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: true,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * MobiKwik PENDING
     *
     * Do not call again.
     */

    if (existingAttempt.status === "PENDING") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: true,
        alreadySuccessful: false,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * MobiKwik FAILED
     *
     * No other vendor is available.
     */

    if (existingAttempt.status === "FAILED") {
      return {
        nextVendor: null,

        allVendorsFailed: true,
        waitingForVendor: false,
        alreadySuccessful: false,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }
  }

  /*
   * --------------------------------------------------
   * 8. PREPAID / DTH VENDOR SEQUENCE
   * --------------------------------------------------
   */

  const vendorSequences =
    await OperatorVendorSeqMapping.findAll({
      where: {
        operatorId: order.operatorId,
      },

      include: [
        {
          model: AvailableAPIs,
          as: "vendor",

          attributes: [
            "id",
            "name",
            "url",
            "status",
          ],

          where: {
            status: true,
          },

          required: true,
        },
      ],

      order: [
        ["sequence", "ASC"],
      ],
    });

  /*
   * --------------------------------------------------
   * 9. NO SEQUENCE
   * --------------------------------------------------
   *
   * If Prepaid/DTH has no configured sequence,
   * MOBIKWIK becomes the ONLY / FINAL vendor.
   */

  if (!vendorSequences.length) {
    const mobikwik =
      await AvailableAPIs.findOne({
        where: {
          name: "MOBIKWIK",
          status: true,
        },

        attributes: [
          "id",
          "name",
          "url",
          "status",
        ],
      });

    if (!mobikwik) {
      const error = new Error(
        "Default vendor MOBIKWIK is not available"
      );

      error.code =
        "DEFAULT_VENDOR_NOT_AVAILABLE";
      error.message = "Default vendor MOBIKWIK is not available";
      error.debugMessage = "error from determineVendorSequence.js"

      throw error;
    }

    /*
     * MobiKwik must be mapped with operator.
     */

    const operatorVendor =
      operatorVendorMap.get(mobikwik.id);

    if (!operatorVendor) {
      const error = new Error(
        "MOBIKWIK is not mapped with this operator"
      );

      error.code =
        "DEFAULT_VENDOR_NOT_MAPPED";

      error.message = "MOBIKWIK is not mapped with this operator";
      error.debugMessage = "error from determineVendorSequence.js"

      throw error;
    }

    const existingAttempt =
      attemptMap.get(mobikwik.id);

    /*
     * No previous attempt
     */

    if (!existingAttempt) {
      return {
        nextVendor: {
          vendorId: mobikwik.id,
          sequence: null,
          vendor: mobikwik,
          operatorVendor,
          attempt: null,
        },

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: false,
        isDefaultVendor: true,
      };
    }

    /*
     * MobiKwik SUCCESS
     */

    if (existingAttempt.status === "SUCCESS") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: true,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * MobiKwik PENDING
     */

    if (existingAttempt.status === "PENDING") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: true,
        alreadySuccessful: false,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * MobiKwik FAILED
     */

    if (existingAttempt.status === "FAILED") {
      return {
        nextVendor: null,

        allVendorsFailed: true,
        waitingForVendor: false,
        alreadySuccessful: false,
        isDefaultVendor: true,

        vendorId: mobikwik.id,
        sequence: null,
        vendor: mobikwik,
        operatorVendor,
        attempt: existingAttempt,
      };
    }
  }

  /*
   * --------------------------------------------------
   * 10. PROCESS VENDOR SEQUENCE
   * --------------------------------------------------
   */

  for (const sequenceMapping of vendorSequences) {
    const vendorId =
      sequenceMapping.vendorId;

    const vendor =
      sequenceMapping.vendor;

    /*
     * --------------------------------------------------
     * Vendor must be mapped with operator
     * --------------------------------------------------
     */

    const operatorVendor =
      operatorVendorMap.get(vendorId);

    if (!operatorVendor) {
      const error = new Error(
        `Vendor ${vendor.name} is not mapped with this operator`
      );

      error.code =
        "VENDOR_NOT_MAPPED_WITH_OPERATOR";
      error.message = `Vendor ${vendor.name} is not mapped with this operator`;
      error.debugMessage = "error from determineVendorSequence.js"

      error.vendorId = vendorId;
      error.vendorName = vendor.name;

      throw error;
    }

    /*
     * --------------------------------------------------
     * Check existing attempt
     * --------------------------------------------------
     */

    const existingAttempt =
      attemptMap.get(vendorId);

    /*
     * --------------------------------------------------
     * No attempt
     *
     * This is the next vendor to call.
     * --------------------------------------------------
     */

    if (!existingAttempt) {
      return {
        nextVendor: {
          vendorId,
          sequence:
            sequenceMapping.sequence,
          vendor,
          operatorVendor,
          attempt: null,
        },

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: false,
        isDefaultVendor: false,
      };
    }

    /*
     * --------------------------------------------------
     * SUCCESS
     *
     * Stop processing.
     * --------------------------------------------------
     */

    if (existingAttempt.status === "SUCCESS") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: false,
        alreadySuccessful: true,
        isDefaultVendor: false,

        vendorId,
        sequence:
          sequenceMapping.sequence,
        vendor,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * --------------------------------------------------
     * PENDING
     *
     * Stop processing.
     * --------------------------------------------------
     */

    if (existingAttempt.status === "PENDING") {
      return {
        nextVendor: null,

        allVendorsFailed: false,
        waitingForVendor: true,
        alreadySuccessful: false,
        isDefaultVendor: false,

        vendorId,
        sequence:
          sequenceMapping.sequence,
        vendor,
        operatorVendor,
        attempt: existingAttempt,
      };
    }

    /*
     * --------------------------------------------------
     * FAILED
     *
     * Continue to next sequence vendor.
     * --------------------------------------------------
     */

    if (existingAttempt.status === "FAILED") {
      continue;
    }
  }

  /*
   * --------------------------------------------------
   * 11. ALL SEQUENCE VENDORS FAILED
   * --------------------------------------------------
   */

  return {
    nextVendor: null,

    allVendorsFailed: true,
    waitingForVendor: false,
    alreadySuccessful: false,
    isDefaultVendor: false,
  };
};

module.exports = {
  determineVendorSequence,
};