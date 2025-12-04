const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')


const Otp = sequelize.define('otp', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expirationTime: {
        type: DataTypes.DATE,
        allowNull: false
    }

});

module.exports = Otp;