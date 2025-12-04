const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')


const MobileOtp = sequelize.define('MobileOtp', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    mobileNo: {
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

module.exports = MobileOtp;