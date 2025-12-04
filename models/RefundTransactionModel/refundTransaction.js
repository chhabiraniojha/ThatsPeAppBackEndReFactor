const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const WalletTransaction = require('../WalletModels/Wallet Transaction/walletTransaction');
const AllTransactions = require('../RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');

const RefundTransaction = sequelize.define('RefundTransaction', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  walletTransactionId: {
    type: DataTypes.STRING,
    references: {
      model: WalletTransaction,
      key: 'id'
    },
    allowNull: false,
    onDelete: 'CASCADE'
  },
  allTransactionId: {
    type: DataTypes.STRING,
    references: {
      model: AllTransactions,
      key: 'id'
    },
    allowNull: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  refundStatus: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'pending'
  }
});

WalletTransaction.hasMany(RefundTransaction, { foreignKey: 'walletTransactionId' });
RefundTransaction.belongsTo(WalletTransaction, { foreignKey: 'walletTransactionId' });

AllTransactions.hasMany(RefundTransaction, { foreignKey: 'allTransactionId' });
RefundTransaction.belongsTo(AllTransactions, { foreignKey: 'allTransactionId' });

module.exports = RefundTransaction;
