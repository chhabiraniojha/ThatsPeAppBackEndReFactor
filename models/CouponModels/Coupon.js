const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const Coupon = sequelize.define(
  "Coupon",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Unique coupon code
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // Purpose/type of coupon
    couponType: {
      type: DataTypes.ENUM(
        "GENERAL",
        "FESTIVAL",
        "CAMPAIGN",
        "MANUAL",
        "REFERRAL"
      ),
      allowNull: false,
      defaultValue: "GENERAL",
    },

    // Discount value
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Discount calculation method
    discountType: {
      type: DataTypes.ENUM("RUPEES", "PERCENTAGE"),
      allowNull: false,
      defaultValue: "RUPEES",
    },

    // Minimum recharge/order amount required
    minimumRechargeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    // Maximum number of times this coupon can be used
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // Coupon validity
    validFrom: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Coupon status
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },

    // Audit information
    createdBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "Coupons",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["code"],
        name: "uq_coupon_code",
      },
      {
        fields: ["couponType"],
        name: "idx_coupon_type",
      },
      {
        fields: ["status"],
        name: "idx_coupon_status",
      },
      {
        fields: ["validFrom"],
        name: "idx_coupon_valid_from",
      },
      {
        fields: ["validUntil"],
        name: "idx_coupon_valid_until",
      },
    ],
  }
);

module.exports = Coupon;