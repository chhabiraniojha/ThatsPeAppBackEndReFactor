const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const AvailableAPIs = sequelize.define(
  "AvailableAPIs",
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

    url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    statusCheckUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    complainCheckUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: "AvailableAPIs",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["name"],
        name: "uq_available_apis_name",
      },
      {
        unique: true,
        fields: ["url"],
        name: "uq_available_apis_url",
      },
      {
        unique: true,
        fields: ["statusCheckUrl"],
        name: "uq_available_apis_status_check_url",
      },
      {
        unique: true,
        fields: ["complainCheckUrl"],
        name: "uq_available_apis_complain_check_url",
      },
      {
        fields: ["status"],
        name: "idx_available_apis_status",
      },
    ],
  }
);

module.exports = AvailableAPIs;