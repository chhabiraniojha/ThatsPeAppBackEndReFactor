const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const Maintenance = sequelize.define('Maintenance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true,
        allowNull: false,
    },
    maintenanceStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    }
})

module.exports = Maintenance