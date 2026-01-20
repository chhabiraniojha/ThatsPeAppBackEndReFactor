const { DataTypes } = require('sequelize');
const sequelize = require('../../../util/db_connect');
const User = require('../../UserModels/UserSchema/user');

const Wallet = sequelize.define('Wallet', {
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
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  }
});

module.exports = Wallet;
