const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const Order = require("../OrderModel/order");
const Payment = require("../PaymentModel/payment");
const WalletTransaction = require("../WalletModels/Wallet Transaction/walletTransaction");

const TransactionHistory = sequelize.define(
  "TransactionHistory",
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

    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    paymentMethod: {
      type: DataTypes.ENUM("UPI", "WALLET", "COMBO"),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    onlineTransactionId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: Payment,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    walletTransactionId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: WalletTransaction,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM(
        "CREATED",
        "PROCESSING",
        "PENDING",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
    },
  },
  {
    tableName: "TransactionHistories",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["orderId"],
        name: "uq_transaction_history_order_id",
      },
      {
        fields: ["userId"],
        name: "idx_transaction_history_user_id",
      },
      {
        fields: ["paymentMethod"],
        name: "idx_transaction_history_payment_method",
      },
      {
        fields: ["status"],
        name: "idx_transaction_history_status",
      },
      {
        fields: ["createdAt"],
        name: "idx_transaction_history_created_at",
      },
      {
        fields: ["onlineTransactionId"],
        name: "idx_transaction_history_online_transaction_id",
      },
      {
        fields: ["walletTransactionId"],
        name: "idx_transaction_history_wallet_transaction_id",
      },
    ],
  }
);

/* Order */

Order.hasOne(TransactionHistory, {
  foreignKey: "orderId",
  as: "transactionHistory",
});

TransactionHistory.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

/* User */

User.hasMany(TransactionHistory, {
  foreignKey: "userId",
  as: "transactionHistories",
});

TransactionHistory.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/* Payment */

Payment.hasMany(TransactionHistory, {
  foreignKey: "onlineTransactionId",
  as: "transactionHistories",
});

TransactionHistory.belongsTo(Payment, {
  foreignKey: "onlineTransactionId",
  as: "onlinePayment",
});

/* Wallet Transaction */

WalletTransaction.hasMany(TransactionHistory, {
  foreignKey: "walletTransactionId",
  as: "transactionHistories",
});

TransactionHistory.belongsTo(WalletTransaction, {
  foreignKey: "walletTransactionId",
  as: "walletTransaction",
});

module.exports = TransactionHistory;