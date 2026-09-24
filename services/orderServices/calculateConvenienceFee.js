const { Op } = require("sequelize");

const ConvenienceFeeConfig = require("../../models/ConvenienceFeeModel/ConvenienceFee");

const calculateConvenienceFee = async ({
  discountedAmount,
}) => {
  const amount = Number(discountedAmount);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error(
      "Invalid discounted amount for convenience fee"
    );

    error.code = "INVALID_CONVENIENCE_FEE_AMOUNT";

    throw error;
  }

  const feeConfig = await ConvenienceFeeConfig.findOne({
    where: {
      minAmount: {
        [Op.lte]: amount,
      },
      maxAmount: {
        [Op.gte]: amount,
      },
    },
  });

  if (!feeConfig) {
    const error = new Error(
      "Convenience fee configuration not found for this amount"
    );

    error.code = "CONVENIENCE_FEE_CONFIG_NOT_FOUND";

    throw error;
  }

  return {
    convenienceFee: Number(
      Number(feeConfig.convenienceFee).toFixed(2)
    ),
  };
};

module.exports = {
  calculateConvenienceFee,
};