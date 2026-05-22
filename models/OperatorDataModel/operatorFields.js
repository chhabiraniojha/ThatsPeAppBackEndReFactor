const { DataTypes } = require('sequelize');
const sequelize = require('../../util/db_connect');
const OperatorData = require('./operatorData');

const OperatorFields = sequelize.define('OperatorFields', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    operator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: OperatorData,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    // Param_1 / Param_2 / Param_3
    param_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // UI label
    // Example:
    // Vehicle Number
    // Bank Name
    // DOB
    label: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // View Bill API key
    // Example:
    // cn
    // bankName
    // dob
    fetch_key: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Payment API key
    // Example:
    // ad1
    // ad2
    // null for cn
    payment_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },

    // top => direct payload
    // adParams => inside adParams
    placement: {
        type: DataTypes.ENUM('top', 'adParams'),
        allowNull: false,
        defaultValue: 'top'
    },

    // field mandatory or optional
    required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    showUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    // regex validation if available
    regex: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // dropdown values if needed
    options: {
        type: DataTypes.JSON,
        allowNull: true
    }

}, {
    tableName: 'operator_fields'
});

OperatorData.hasMany(OperatorFields, {
    foreignKey: 'operator_id',
    as: 'fields'
});

OperatorFields.belongsTo(OperatorData, {
    foreignKey: 'operator_id',
    as: 'operator'
});

module.exports = OperatorFields;