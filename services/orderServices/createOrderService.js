const {
  getOrderContext,
} = require("./getOrderContext");

const {
  validateOrderRequest,
} = require("./validateOrderRequest");

const {
  buildInputFields,
} = require("../mobikwikServices/mobiKwikInputFieldBuilder");

const {
  validateOrderFields,
} = require("./validateOrderFields");

const {
  calculateOperatorDiscount,
} = require("./calculateOperatorDiscount");

const {
  calculateReferralDiscount,
} = require("./calculateReferralDiscount");

const {
  calculateConvenienceFee,
} = require("./calculateConvenienceFee");

const {
  calculatePaymentSplit,
} = require("./calculatePaymentSplit");

const Wallet = require("../../models/WalletModels/WalletSchema/wallet");

const {
  createOrderTransactionService,
} = require("./createOrderTransaction");


const createOrderService = async ({
  userId,
  operatorId,
  fields,
  cirId,
  billAmount,
  billnetamount,
  paymentMethod,
}) => {

  // --------------------------------------------------
  // 1. Basic request validation
  // --------------------------------------------------

  validateOrderRequest({
    operatorId,
    fields,
    billAmount,
    billnetamount,
    paymentMethod,
  });


  // --------------------------------------------------
  // 2. Get order context
  // --------------------------------------------------

  const {
    user,
    operator,
    subCategory,
    sourceType,
    config,
  } = await getOrderContext({
    userId,
    operatorId,
  });


  // --------------------------------------------------
  // 3. Build expected input fields
  // --------------------------------------------------

  const builderFields = buildInputFields(config);

  if (!Array.isArray(builderFields)) {
    const error = new Error(
      "Unable to generate required input fields"
    );

    error.code = "INPUT_FIELDS_NOT_AVAILABLE";

    throw error;
  }


  // --------------------------------------------------
  // 4. Validate frontend fields
  // --------------------------------------------------

  const fieldValidation = validateOrderFields({
    frontendFields: fields,
    builderFields,
  });

  if (!fieldValidation.valid) {
    const error = new Error(
      fieldValidation.message
    );

    error.code = "INVALID_ORDER_FIELDS";

    throw error;
  }


  // --------------------------------------------------
  // 5. Calculate operator discount
  // --------------------------------------------------

  const operatorDiscountResult =
    calculateOperatorDiscount({
      amount: billAmount,
      operator,
    });


  // --------------------------------------------------
  // 6. Calculate referral discount
  // --------------------------------------------------

  const referralDiscountResult =
    await calculateReferralDiscount({
      userId,
      amountAfterOperatorDiscount:
        operatorDiscountResult.amountAfterOperatorDiscount,
    });


  // --------------------------------------------------
  // 7. Calculate convenience fee
  // --------------------------------------------------

  const convenienceFeeResult =
    await calculateConvenienceFee({
      discountedAmount:
        referralDiscountResult.discountedAmount,
    });


  // --------------------------------------------------
  // 8. Calculate final payable amount
  // --------------------------------------------------

  const finalPayableAmount = Number(
    (
      Number(
        referralDiscountResult.discountedAmount
      ) +
      Number(
        convenienceFeeResult.convenienceFee
      )
    ).toFixed(2)
  );


  // --------------------------------------------------
  // 9. Get wallet balance
  // --------------------------------------------------

  // Wallet balance is ONLY checked here.
  //
  // Actual wallet debit will happen later during
  // fulfillment using atomic database update.
  //
  // UPI does not require wallet balance.
  // WALLET / COMBO require active wallet.

  let walletBalance = 0;

  if (
    paymentMethod === "WALLET" ||
    paymentMethod === "COMBO"
  ) {

    const wallet = await Wallet.findOne({
      where: {
        userId,
        status: "active",
      },
    });

    if (!wallet) {
      const error = new Error(
        "Active wallet not found"
      );

      error.code = "WALLET_NOT_FOUND";

      throw error;
    }

    walletBalance = Number(wallet.balance);

    if (
      !Number.isFinite(walletBalance) ||
      walletBalance <= 0
    ) {
      const error = new Error(
        "Invalid wallet balance"
      );

      error.code = "INVALID_WALLET_BALANCE";

      throw error;
    }
  }


  // --------------------------------------------------
  // 10. Calculate payment split
  // --------------------------------------------------

  const {
    walletAmount,
    onlinePaidAmount,
  } = calculatePaymentSplit({
    paymentMethod,
    finalPayableAmount,
    walletBalance,
  });


  // --------------------------------------------------
  // 11. Create Order + Payment + Transaction History
  // --------------------------------------------------
  //
  // createOrderTransactionService internally:
  //
  // 1. Starts DB transaction
  // 2. Creates Order
  // 3. Creates Payment if onlinePaidAmount > 0
  // 4. Creates TransactionHistory
  // 5. Commits everything
  //
  // If any step fails -> complete DB rollback.
  //
  // Wallet is NOT debited here.
  // WalletTransaction is NOT created here.
  // Vendor API is NOT called here.

  const {
    order,
    payment,
    transactionHistory,
  } = await createOrderTransactionService({

    // User object is required by payment service
    // for gateway-specific customer details
    // such as Zaakpay buyer information.
    user,

    userId,

    operatorId,

    subCategoryId: subCategory.id,

    circleId: cirId || null,

    fields: fieldValidation.fields,

    amount: Number(billAmount),

    operatorDiscount:
      operatorDiscountResult.operatorDiscount,

    referralDiscount:
      referralDiscountResult.referralDiscount,

    discountedAmount:
      referralDiscountResult.discountedAmount,

    convenienceFee:
      convenienceFeeResult.convenienceFee,

    finalPayableAmount,

    paymentMethod,

    walletAmount,

    onlinePaidAmount,
  });


  // --------------------------------------------------
  // 12. Return created order + payment details
  // --------------------------------------------------

  return {
    order,

    payment,

    transactionHistory,

    referralApplied:
      referralDiscountResult.referralApplied,

    referralId:
      referralDiscountResult.referralId,

    billnetamount,
  };
};


module.exports = {
  createOrderService,
};