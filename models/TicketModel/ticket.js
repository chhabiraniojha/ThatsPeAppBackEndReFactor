const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const User = require('../../models/UserModels/UserSchema/user');
const rechargeAndBillPaymentTransactions = require('../RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const SubCategory = require('../SubCategoryModel/subCategory');

const Ticket = sequelize.define('Ticket', {
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
    onDelete: 'CASCADE'
  },
  executiveId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Admins',
      key: 'AdminId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: rechargeAndBillPaymentTransactions,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  ticketDescription: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resolveMessage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'close'),
    allowNull: false,
    defaultValue: 'open'
  },
  resolveStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  interveneStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requestingStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ticketSubCategory: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// User.hasMany(Ticket, { foreignKey: 'userId' });
// Ticket.belongsTo(User, { foreignKey: 'userId' });

// rechargeAndBillPaymentTransactions.hasMany(Ticket, { foreignKey: 'transactionId' });
// Ticket.belongsTo(rechargeAndBillPaymentTransactions, { foreignKey: 'transactionId' });

module.exports = Ticket;
