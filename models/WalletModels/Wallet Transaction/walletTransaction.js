const { DataTypes } = require("sequelize");

const sequelize = require("../../../util/db_connect");

const Wallet = require("../WalletSchema/wallet");
const Order = require("../../OrderModel/order");

const WalletTransaction = sequelize.define(
  "WalletTransaction",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    walletId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Wallet,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    startingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    endingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    transactionType: {
      type: DataTypes.ENUM(
        "REWARD",
        "RECHARGE",
        "REFUND",
        "WITHDRAW"
      ),
      allowNull: false,
    },

    balanceType: {
      type: DataTypes.ENUM("CREDIT", "DEBIT"),
      allowNull: false,
    },

    orderId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
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

    failureReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "WalletTransactions",
    timestamps: true,

    indexes: [
      {
        fields: ["walletId"],
        name: "idx_wallet_transaction_wallet_id",
      },
      {
        fields: ["orderId"],
        name: "idx_wallet_transaction_order_id",
      },
      {
        fields: ["transactionType"],
        name: "idx_wallet_transaction_type",
      },
      {
        fields: ["balanceType"],
        name: "idx_wallet_transaction_balance_type",
      },
      {
        fields: ["status"],
        name: "idx_wallet_transaction_status",
      },
      {
        fields: ["createdAt"],
        name: "idx_wallet_transaction_created_at",
      },
    ],
  }
);

/* Associations */

Wallet.hasMany(WalletTransaction, {
  foreignKey: "walletId",
  as: "transactions",
});

WalletTransaction.belongsTo(Wallet, {
  foreignKey: "walletId",
  as: "wallet",
});

Order.hasMany(WalletTransaction, {
  foreignKey: "orderId",
  as: "walletTransactions",
});

WalletTransaction.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

module.exports = WalletTransaction;