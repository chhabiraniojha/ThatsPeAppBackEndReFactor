const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const OperatorData = require("../OperatorDataModel/operatorData");
const AvailableAPIs = require("../APIModels/api");

const OperatorVendorMapping = sequelize.define(
  "OperatorVendorMapping",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    operatorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: OperatorData,
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

    vendorOperatorCode: {
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
    tableName: "OperatorVendorMapping",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["operatorId", "vendorId"],
        name: "uq_operator_vendor_mapping",
      },
      {
        fields: ["operatorId"],
        name: "idx_operator_vendor_operator_id",
      },
      {
        fields: ["vendorId"],
        name: "idx_operator_vendor_vendor_id",
      },
      {
        fields: ["status"],
        name: "idx_operator_vendor_status",
      },
    ],
  }
);

// OperatorData → OperatorVendorMapping
OperatorData.hasMany(OperatorVendorMapping, {
  foreignKey: "operatorId",
  as: "vendorMappings",
});

OperatorVendorMapping.belongsTo(OperatorData, {
  foreignKey: "operatorId",
  as: "operator",
});

// AvailableAPIs → OperatorVendorMapping
AvailableAPIs.hasMany(OperatorVendorMapping, {
  foreignKey: "vendorId",
  as: "operatorMappings",
});

OperatorVendorMapping.belongsTo(AvailableAPIs, {
  foreignKey: "vendorId",
  as: "vendor",
});

module.exports = OperatorVendorMapping;