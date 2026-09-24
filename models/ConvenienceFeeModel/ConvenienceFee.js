const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const ConvenienceFeeConfig = sequelize.define(
    "ConvenienceFeeConfig",
    {
        id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            primaryKey: true,
        },

        minAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        maxAmount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        convenienceFee: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
        },

        createdBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },

        updatedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
    },
    {
        tableName: "ConvenienceFeeConfigs",
        timestamps: true,

        indexes: [
            {
                fields: ["minAmount", "maxAmount"],
                name: "idx_convenience_fee_range",
            },
        ],
    }
);

module.exports = ConvenienceFeeConfig;