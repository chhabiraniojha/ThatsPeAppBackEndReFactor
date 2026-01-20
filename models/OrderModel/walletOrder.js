const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const User = require('../UserModels/UserSchema/user');
const Wallet = require('../WalletModels/WalletSchema/wallet');


const WalletOrder = sequelize.define('WalletOrder', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  walletAction: {
    type: DataTypes.ENUM('ADD'),
    allowNull: false
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

 
  status: {
    type: DataTypes.ENUM('CREATED', 'PROCESSING', 'SUCCESS', 'FAILED'),
    allowNull: false,
    defaultValue: 'CREATED'
  }
});

module.exports = WalletOrder;
