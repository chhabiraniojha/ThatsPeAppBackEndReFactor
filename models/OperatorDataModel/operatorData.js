const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const Subcategory = require('../SubCategoryModel/subCategory');

const OperatorData = sequelize.define('OperatorData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ezytm_operator_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cyrus_operator_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  a1_operator_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  robotic_exchange_operator_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recharge_exchange_operator_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
    mobi_operator_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
    mobi_cir_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  operator_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  discount_type: {
    type: DataTypes.ENUM('rupees', 'percentage'),
    allowNull: true,
    defaultValue: null
  },
  operator_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  subcategory_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: Subcategory,
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  }
});

module.exports = OperatorData;
