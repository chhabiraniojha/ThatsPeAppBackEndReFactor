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

    // Frontend label
    // Example:
    // Vehicle Number
    // Mobile Number
    // DOB
    label: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // View Bill API key
    // Example:
    // cn
    // bankName
    // mobileNumber
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
        type: DataTypes.ENUM(
            'top',
            'adParams'
        ),
        allowNull: false,
        defaultValue: 'top'
    },

    // required or optional
    required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    // show on frontend?
    showUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },

    // where value will come from
    // user => req.body
    // static => default_value
    value_source: {
        type: DataTypes.ENUM(
            'user',
            'static'
        ),
        allowNull: false,
        defaultValue: 'user'
    },

    // static value
    // Example:
    // 16
    // 17
    default_value: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // frontend field type
    // text
    // number
    // dropdown
    // date
    field_type: {
        type: DataTypes.ENUM(
            'text',
            'number',
            'dropdown',
            'date'
        ),
        allowNull: false,
        defaultValue: 'text'
    },

    // regex validation
    regex: {
        type: DataTypes.STRING,
        allowNull: true
    },


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