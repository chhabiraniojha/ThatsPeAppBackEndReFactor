const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const PaymentGateway = sequelize.define(
  "PaymentGateway",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    secret: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "PaymentGateways",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["name"],
        name: "uq_payment_gateway_name",
      },
      {
        fields: ["status"],
        name: "idx_payment_gateway_status",
      },
    ],
  }
);

module.exports = PaymentGateway;