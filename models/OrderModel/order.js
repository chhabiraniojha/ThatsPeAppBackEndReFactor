const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const User = require('../UserModels/UserSchema/user');
const SubCategory = require('../SubCategoryModel/subCategory');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
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

  serviceType: {
    type: DataTypes.STRING(50),
    allowNull: true, // MOBILE, DTH, etc
    references: {
      model: SubCategory,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },

  serviceRef: {
    type: DataTypes.STRING(50),
    allowNull: true // mobile number / account
  },
  operatorType: {
    type: DataTypes.STRING(50),
    allowNull: true // type of operator -- dth / prepaid / postpaid
  },
    operator: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  circle: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('CREATED', 'PENDING', 'SUCCESS', 'FAILED'),
    allowNull: false,
    defaultValue: 'CREATED'
  }
});

module.exports = Order;
