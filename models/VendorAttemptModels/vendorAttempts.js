const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const RechargeTransaction = require("../RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions");
const AvailableAPIs = require("../APIModels/api");

const RechargeVendorAttempt = sequelize.define(
  "RechargeVendorAttempt",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    rechargeTransactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: RechargeTransaction,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    apiId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: AvailableAPIs,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    vendorTransactionId: {
      type: DataTypes.STRING,
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
    indexes: [
      {
        unique: true,
        fields: ["rechargeTransactionId", "apiId"],
      },
      {
        fields: ["rechargeTransactionId"],
      },
      {
        fields: ["apiId"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

RechargeTransaction.hasMany(RechargeVendorAttempt, {
  foreignKey: "rechargeTransactionId",
  as: "vendorAttempts",
});

RechargeVendorAttempt.belongsTo(RechargeTransaction, {
  foreignKey: "rechargeTransactionId",
});

AvailableAPIs.hasMany(RechargeVendorAttempt, {
  foreignKey: "apiId",
  as: "vendorAttempts",
});

RechargeVendorAttempt.belongsTo(AvailableAPIs, {
  foreignKey: "apiId",
});

module.exports = RechargeVendorAttempt;