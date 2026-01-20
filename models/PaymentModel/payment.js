const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const Order = require('../OrderModel/order');
const User = require('../UserModels/UserSchema/user');
const WalletOrder = require('../OrderModel/walletOrder');
const PaymentGateway = require('../PayentGatway/paymentGatway');

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
    unique: 'Payment_orderId_unique',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  walletOrderId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: WalletOrder, // refers to orders table
      key: 'id'
    },
    unique: 'Payment_walletOrderId_unique',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
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

  gateway: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'VEGAH'
  },
  gatewayId: {
    type: DataTypes.STRING(50),
    allowNull: false, 
    references: {
      model: PaymentGateway,
      key: 'id'
    },
    defaultValue: 'BqvhSS7CPJu2UEZmjmQhfg',  // this is only  for vegah upi  BUT in future if we add more gateways we can change this value accordingly
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },

  paymentMode: {
    type: DataTypes.ENUM('UPI'),
    allowNull: true
  },

  gatewayTransactionId: {
    type: DataTypes.STRING(50),    
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
  
},
{
    tableName: 'payments',
    timestamps: true,

    indexes: [
      {
        name: 'uniq_gateway_txn',
        unique: true,
        fields: ['gatewayId', 'gatewayTransactionId']
      }
    ]
  }

);

module.exports = Payment;
