const calculatePaymentSplit = ({
  paymentMethod,
  finalPayableAmount,
  walletBalance,
}) => {
  const payableAmount = Number(finalPayableAmount);
  const balance = Number(walletBalance);

  if (
    !Number.isFinite(payableAmount) ||
    payableAmount < 0
  ) {
    const error = new Error(
      "Invalid final payable amount"
    );

    error.code = "INVALID_FINAL_PAYABLE_AMOUNT";

    throw error;
  }

  if (
    !Number.isFinite(balance) ||
    balance < 0
  ) {
    const error = new Error(
      "Invalid wallet balance"
    );

    error.code = "INVALID_WALLET_BALANCE";

    throw error;
  }

  let walletAmount = 0;
  let onlinePaidAmount = 0;

  // --------------------------------------------------
  // UPI
  // --------------------------------------------------

  if (paymentMethod === "UPI") {
    walletAmount = 0;
    onlinePaidAmount = payableAmount;
  }

  // --------------------------------------------------
  // WALLET
  // --------------------------------------------------

  else if (paymentMethod === "WALLET") {
    if (balance < payableAmount) {
      const error = new Error(
        "Insufficient wallet balance"
      );

      error.code = "INSUFFICIENT_WALLET_BALANCE";

      throw error;
    }

    walletAmount = payableAmount;
    onlinePaidAmount = 0;
  }

  // --------------------------------------------------
  // COMBO
  // --------------------------------------------------

  else if (paymentMethod === "COMBO") {

    // Wallet balance must be greater than zero
    if (balance <= 0) {
      const error = new Error(
        "Wallet balance is required for combo payment"
      );

      error.code = "COMBO_WALLET_BALANCE_REQUIRED";

      throw error;
    }

    // If wallet can pay the complete amount,
    // combo payment is not required.
    if (balance >= payableAmount) {
      const error = new Error(
        "Combo payment is not required when wallet balance is sufficient"
      );

      error.code = "COMBO_NOT_REQUIRED";

      throw error;
    }

    // Partial wallet + remaining online payment
    walletAmount = balance;

    onlinePaidAmount =
      payableAmount - walletAmount;
  }

  // --------------------------------------------------
  // Invalid payment method
  // --------------------------------------------------

  else {
    const error = new Error(
      "Invalid payment method"
    );

    error.code = "INVALID_PAYMENT_METHOD";

    throw error;
  }

  return {
    walletAmount: Number(
      walletAmount.toFixed(2)
    ),

    onlinePaidAmount: Number(
      onlinePaidAmount.toFixed(2)
    ),
  };
};

module.exports = {
  calculatePaymentSplit,
};