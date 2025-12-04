const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    }, 
    categoryName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER,
      
        unique: 'unique_Category_order'
    }
})

module.exports = Category