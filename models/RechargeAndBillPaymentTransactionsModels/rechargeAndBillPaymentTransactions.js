const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");
const AvailableAPIs = require("../APIModels/api");
const User = require("../UserModels/UserSchema/user");

const RechargeAndBillPayTransaction = sequelize.define("AllTransactions", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  apiTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: AvailableAPIs,  
      key: "id",
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  },
  customerNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  discountedAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    // defaultValue:0.00
  },
  operator: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  circle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  circleCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  operatorCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cashPaymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'RechargeAndBillPayTransaction_cashPaymentTransactionId_unique',
  },
  walletPaymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'RechargeAndBillPayTransaction_WalletPaymentTransactionId_unique',
  },
  paymentTransactionType: {
    type: DataTypes.ENUM("cash", "wallet"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('CREATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'PENDING'),
    allowNull: false,
  },
  refundStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
          model: User,
          key: 'id' 
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'

  },
 
  subCategoryId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: { 
          model: 'SubCategories',
          key: 'id' 
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'

  }
});

module.exports = RechargeAndBillPayTransaction;
