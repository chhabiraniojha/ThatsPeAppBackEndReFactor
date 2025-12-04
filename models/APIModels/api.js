const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const AvailableAPIs = sequelize.define('AvailableAPIs',
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        statusCheckUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        complainCheckUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false
        }
    }
)

module.exports = AvailableAPIs