const Razorpay = require("razorpay");


const razorpayCreateOrder = async ({
  gateway,
  amount,
  receipt,
}) => {

  // --------------------------------------------------
  // 1. Validate gateway configuration
  // --------------------------------------------------

  if (!gateway) {
    const error = new Error(
      "Payment gateway configuration is required"
    );

    error.code = "PAYMENT_GATEWAY_CONFIG_REQUIRED";

    throw error;
  }

  if (!gateway.key || !gateway.secret) {
    const error = new Error(
      "Razorpay gateway configuration is incomplete"
    );

    error.code = "RAZORPAY_CONFIG_INCOMPLETE";

    throw error;
  }


  // --------------------------------------------------
  // 2. Validate amount
  // --------------------------------------------------

  const paymentAmount = Number(amount);

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    const error = new Error(
      "Invalid Razorpay payment amount"
    );

    error.code = "INVALID_RAZORPAY_AMOUNT";

    throw error;
  }


  // --------------------------------------------------
  // 3. Validate receipt
  // --------------------------------------------------

  if (!receipt) {
    const error = new Error(
      "Razorpay receipt is required"
    );

    error.code = "RAZORPAY_RECEIPT_REQUIRED";

    throw error;
  }


  // --------------------------------------------------
  // 4. Initialize Razorpay
  // --------------------------------------------------

  const razorpay = new Razorpay({
    key_id: gateway.key,
    key_secret: gateway.secret,
  });


  // --------------------------------------------------
  // 5. Convert INR to paise
  // --------------------------------------------------

  const amountInPaise = Math.round(
    paymentAmount * 100
  );


  // --------------------------------------------------
  // 6. Create Razorpay order
  // --------------------------------------------------

  const razorpayOrder =
    await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    });


  // --------------------------------------------------
  // 7. Return normalized gateway response
  // --------------------------------------------------

return {
  paymentType: "CHECKOUT",

  data: {
    key: gateway.key,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  },
};
}


module.exports = {
  razorpayCreateOrder,
};