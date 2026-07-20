const { DataTypes } = require('sequelize');
const sequelize = require('../../../util/db_connect');
const Wallet = require('../WalletSchema/wallet');
const subCategoryModel = require('../../SubCategoryModel/subCategory');
const PaymentTransactionModel = require('../../PaymentTransactionModel/paymentTransaction');
const PaymentModel = require('../../PaymentModel/payment');
const refundTransactionModel = require('../../RefundTransactionModel/refundTransaction');
const RechargeTransactionModel = require('../../RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  walletId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Wallet,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  startingBalance: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  endingBalance: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: null
  },
  transactionType: {
    type: DataTypes.ENUM('Add Funds', 'Recharge', 'Refund','Redeem'),
    allowNull: false
  },
  balanceType: {
    type: DataTypes.ENUM('Credit', 'Debit'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: RechargeTransactionModel,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  rechargeTypeId: {
    type: DataTypes.STRING,
    allowNull: true, // Make it optional for non-recharge transactions
    references: {
      model: subCategoryModel,
      key: 'id'
    },
    omdelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  paymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'unique_WalletTransaction_paymentTransactionId',
    references: {
      model: PaymentModel,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
});



module.exports = WalletTransaction;
