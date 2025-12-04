const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')


const RechargeAndBillPayTransactionDummy = sequelize.define('AllTransactionsTests',
    {
        Id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        APITransactionId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        customerNo: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        operator: {
            type: DataTypes.STRING,
            allowNull: false
        },
        circle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        circleCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        operatorCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cashPaymentTransactionId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        WalletPaymentTransactionId: {
            type: DataTypes.STRING,
            allowNull: true
        }, 
        SubCategoryId: {
            type: DataTypes.STRING,
            allowNull: true
        }, 
        UserId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        paymentTransactionType: {
            type: DataTypes.ENUM('cash', 'wallet'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('success', 'pending', 'failed'),
            allowNull: false
        },
        refundStatus: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
)

module.exports = RechargeAndBillPayTransactionDummy