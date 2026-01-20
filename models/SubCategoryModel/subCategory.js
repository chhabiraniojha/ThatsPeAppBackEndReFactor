const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const Category = require('../CategoryModel/category');

const Subcategory = sequelize.define('SubCategory', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  categoryId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false
  },
  popular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER
  },
  popularityorder: {
    type: DataTypes.INTEGER,
    unique: 'unique_SubCategory_popularityorder'
  }
});



module.exports = Subcategory;
