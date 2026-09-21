const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const CircleData = sequelize.define(
  "CircleData",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
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
    tableName: "Circles",
    timestamps: true,

    indexes: [
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = CircleData;