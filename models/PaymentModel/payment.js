const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const Order = require('../OrderModel/order');
const User = require('../UserModels/UserSchema/user');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },

  orderId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: Order, // refers to orders table
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },

  gateway: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'VEGAH'
  },

  paymentMode: {
    type: DataTypes.ENUM('UPI'),
    allowNull: true
  },

  gatewayTransactionId: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },

  rrn: {
    type: DataTypes.STRING(50),
    allowNull: true
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('INITIATED', 'SUCCESS', 'FAILED'),
    allowNull: false,
    defaultValue: 'INITIATED'
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  purpose: {
    type: DataTypes.ENUM('recharge', 'addfund'),
    allowNull: true
  },
  responseCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  rawCallback: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = Payment;
