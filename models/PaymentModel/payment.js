const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const Order = require('../OrderModel/order');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.STRING,    
    primaryKey: true
  },

  orderId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: Order,          // refers to orders table
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
