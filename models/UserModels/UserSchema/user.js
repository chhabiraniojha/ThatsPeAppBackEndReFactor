const { DataTypes } = require('sequelize')
const sequelize = require('../../../util/db_connect')

const User = sequelize.define('User', {
    // Define your model attributes here
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
       mobileNo: {
        type: DataTypes.STRING, 
          unique: 'unique_User_mobileNo', 
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,      
        allowNull: false
    }, 
    password: {
        type: DataTypes.STRING, 
        allowNull: false
    },
 
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false
    }
})

module.exports = User