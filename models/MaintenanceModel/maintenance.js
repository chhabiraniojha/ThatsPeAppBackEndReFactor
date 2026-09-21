const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const Maintenance = sequelize.define(
  "Maintenance",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    maintenanceStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    startAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    endAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: "Maintenances",
    timestamps: true,

    indexes: [
      {
        fields: ["maintenanceStatus"],
        name: "idx_maintenance_status",
      },
      {
        fields: ["startAt"],
        name: "idx_maintenance_start_at",
      },
      {
        fields: ["endAt"],
        name: "idx_maintenance_end_at",
      },
    ],
  }
);

module.exports = Maintenance;