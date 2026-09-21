const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const Order = require("../OrderModel/order");
const Vendor = require("../APIModels/api");

const RechargeVendorAttempt = sequelize.define(
  "RechargeVendorAttempt",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    orderId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    vendorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Vendor,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    vendorTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    rawResponse: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    callbackReceived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    callbackAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "RechargeVendorAttempts",
    timestamps: true,

    indexes: [
      {
        fields: ["orderId"],
        name: "idx_recharge_vendor_attempt_order_id",
      },
      {
        fields: ["vendorId"],
        name: "idx_recharge_vendor_attempt_vendor_id",
      },
      {
        fields: ["status"],
        name: "idx_recharge_vendor_attempt_status",
      },
      {
        fields: ["vendorTransactionId"],
        name: "idx_recharge_vendor_attempt_vendor_transaction_id",
      },
      {
        unique: true,
        fields: ["orderId", "vendorId"],
        name: "uq_recharge_vendor_attempt_order_vendor",
      },
    ],
  }
);

/* Order */

Order.hasMany(RechargeVendorAttempt, {
  foreignKey: "orderId",
  as: "vendorAttempts",
});

RechargeVendorAttempt.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

/* Vendor */

Vendor.hasMany(RechargeVendorAttempt, {
  foreignKey: "vendorId",
  as: "rechargeAttempts",
});

RechargeVendorAttempt.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

module.exports = RechargeVendorAttempt;