const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const MobileOtp = sequelize.define(
  "MobileOtp",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    mobileNo: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    otp: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    expirationTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "MobileOtps",
    timestamps: true,

    indexes: [
      {
        fields: ["mobileNo"],
        name: "idx_mobile_otp_mobile_no",
      },
      {
        fields: ["expirationTime"],
        name: "idx_mobile_otp_expiration_time",
      },
      {
        fields: ["isVerified"],
        name: "idx_mobile_otp_is_verified",
      },
    ],
  }
);

module.exports = MobileOtp;