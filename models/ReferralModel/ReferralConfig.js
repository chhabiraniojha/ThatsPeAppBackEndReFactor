const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const ReferralConfig = sequelize.define(
  "ReferralConfig",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    referrerReward: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    couponDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    minimumRechargeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 299.00,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },

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
    tableName: "ReferralConfigs",
    timestamps: true,

    indexes: [
      {
        fields: ["status"],
        name: "idx_referral_config_status",
      },
    ],
  }
);

module.exports = ReferralConfig;