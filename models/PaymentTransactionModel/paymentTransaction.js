const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')
const User = require('../UserModels/UserSchema/user');


const PaymentTransaction = sequelize.define('paymentTransaction', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    transactionAmount:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    transactionFor:{
        type:DataTypes.STRING,
        allowNull:false
    },
    status: {
        type: DataTypes.ENUM('success', 'failed','pending'),
        allowNull: false,
        defaultValue:'pending'
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    },
    UserId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }

});

module.exports = PaymentTransaction;