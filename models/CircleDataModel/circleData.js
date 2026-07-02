const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const CircleData = sequelize.define('CircleData',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ezytm_circle_code: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cyrus_circle_code: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        a1_circle_code: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        robotic_exchange_circle_code: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mobikwik_circle_code: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }
)


module.exports = CircleData


