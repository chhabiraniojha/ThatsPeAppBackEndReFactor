const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const Wallet = require("../WalletModels/WalletSchema/wallet");
const WalletTransaction = require("../WalletModels/Wallet Transaction/walletTransaction");

const WalletWithdrawal = sequelize.define(
  "WalletWithdrawal",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
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

    // Withdrawal method
    withdrawalMethod: {
      type: DataTypes.ENUM("BANK", "UPI"),
      allowNull: false,
    },

    // Bank withdrawal details
    accountHolderName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    ifscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    bankName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    // UPI withdrawal details
    upiId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "APPROVED",
        "REJECTED",
        "PROCESSING",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
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

    rejectionReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    failureReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "WalletWithdrawals",
    timestamps: true,

    indexes: [
      {
        fields: ["userId"],
        name: "idx_wallet_withdrawal_user_id",
      },
      {
        fields: ["walletId"],
        name: "idx_wallet_withdrawal_wallet_id",
      },
      {
        fields: ["withdrawalMethod"],
        name: "idx_wallet_withdrawal_method",
      },
      {
        fields: ["status"],
        name: "idx_wallet_withdrawal_status",
      },
      {
        fields: ["walletTransactionId"],
        name: "idx_wallet_withdrawal_wallet_transaction_id",
      },
      {
        fields: ["createdAt"],
        name: "idx_wallet_withdrawal_created_at",
      },
    ],
  }
);

/* User */

User.hasMany(WalletWithdrawal, {
  foreignKey: "userId",
  as: "walletWithdrawals",
});

WalletWithdrawal.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/* Wallet */

Wallet.hasMany(WalletWithdrawal, {
  foreignKey: "walletId",
  as: "withdrawals",
});

WalletWithdrawal.belongsTo(Wallet, {
  foreignKey: "walletId",
  as: "wallet",
});

/* Wallet Transaction */

WalletTransaction.hasOne(WalletWithdrawal, {
  foreignKey: "walletTransactionId",
  as: "withdrawal",
});

WalletWithdrawal.belongsTo(WalletTransaction, {
  foreignKey: "walletTransactionId",
  as: "walletTransaction",
});

module.exports = WalletWithdrawal;