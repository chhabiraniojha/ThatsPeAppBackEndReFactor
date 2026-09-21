const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");
const CircleData = require("./circleData");
const AvailableAPIs = require("../APIModels/api")

const CircleVendorMapping = sequelize.define(
  "CircleVendorMapping",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    circleId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: CircleData,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    vendorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: AvailableAPIs,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    circleCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    tableName: "CircleVendorMappings",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["circleId", "vendorId"],
      },
      {
        fields: ["circleId"],
      },
      {
        fields: ["vendorId"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

CircleData.hasMany(CircleVendorMapping, {
  foreignKey: "circleId",
  as: "vendorMappings",
});

CircleVendorMapping.belongsTo(CircleData, {
  foreignKey: "circleId",
  as: "circle",
});

AvailableAPIs.hasMany(CircleVendorMapping, {
  foreignKey: "vendorId",
  as: "circleMappings",
});

CircleVendorMapping.belongsTo(AvailableAPIs, {
  foreignKey: "vendorId",
  as: "vendor",
});

module.exports = CircleVendorMapping;