const crypto=require("crypto")
const userModel = require("../models/UserModels/UserSchema/user")
// Generate unique referral code
const generateReferralCode = async (transaction) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomPart = crypto
      .randomBytes(5)
      .toString("hex")
      .toUpperCase();

    const referralCode = `TP${randomPart}`;

    const existingCode = await userModel.findOne({
      where: {
        referralCode,
      },
      attributes: ["id"],
      transaction,
    });

    if (!existingCode) {
      return referralCode;
    }
  }

  throw new Error("Unable to generate unique referral code");
};

module.exports={
    generateReferralCode
}