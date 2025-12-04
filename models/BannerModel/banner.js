const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    bannerImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = Banner