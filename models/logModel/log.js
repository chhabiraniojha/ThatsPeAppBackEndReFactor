const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const Log = sequelize.define('Log', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Automatically set to current timestamp
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    user: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    http_method: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    status_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {

    timestamps: false, // Disable Sequelize's automatic timestamps
});

module.exports = Log;