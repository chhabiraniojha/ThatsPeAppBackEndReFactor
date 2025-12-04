const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const User = require('../../models/UserModels/UserSchema/user');

const paymentInitiateLog = sequelize.define('PaymentInitiateLog', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
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
  purpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  addAmount: {
    type: DataTypes.FLOAT,
    allowNull: true
  },

  originalAmount: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  discountedAmount: {
    type: DataTypes.FLOAT,
    allowNull: true
    // defaultValue:0.00
  },
  // operator: {
  //     type: DataTypes.STRING,
  //     allowNull: true
  // },
  // circle: {
  //     type: DataTypes.STRING,
  //     allowNull: true
  // },
  ezytmCircleCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ezytmOperatorCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clientIp: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

User.hasMany(paymentInitiateLog, { foreignKey: 'userId' });
paymentInitiateLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = paymentInitiateLog;
