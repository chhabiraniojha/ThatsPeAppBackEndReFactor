const calculateOperatorDiscount = ({
  amount,
  operator,
}) => {
  const originalAmount = Number(amount);

  if (!Number.isFinite(originalAmount) || originalAmount < 0) {
    const error = new Error("Invalid order amount");
    error.code = "INVALID_ORDER_AMOUNT";
    throw error;
  }

  const discount = Number(operator.discount);

  if (!Number.isFinite(discount) || discount < 0) {
    const error = new Error("Invalid operator discount");
    error.code = "INVALID_OPERATOR_DISCOUNT";
    throw error;
  }

  let operatorDiscount = 0;

  if (operator.discountType === "percentage") {
    operatorDiscount =
      (originalAmount * discount) / 100;
  }

  if (operator.discountType === "rupees") {
    operatorDiscount = discount;
  }

  // Discount amount original amount se zyada nahi ho sakta
  if (operatorDiscount > originalAmount) {
    operatorDiscount = originalAmount;
  }

  operatorDiscount = Number(
    operatorDiscount.toFixed(2)
  );

  const amountAfterOperatorDiscount = Number(
    (originalAmount - operatorDiscount).toFixed(2)
  );

  return {
    operatorDiscount,
    amountAfterOperatorDiscount,
  };
};

module.exports = {
  calculateOperatorDiscount,
};