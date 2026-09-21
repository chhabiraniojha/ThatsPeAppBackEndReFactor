const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const OperatorData = require("../OperatorDataModel/operatorData");
const AvailableAPIs = require("../APIModels/api");

const OperatorVendorSeqMapping = sequelize.define(
  "OperatorVendorSeqMapping",
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

    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: "OperatorVendorSeqMapping",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["operatorId", "vendorId"],
        name: "uq_operator_vendor_sequence_vendor",
      },
      {
        unique: true,
        fields: ["operatorId", "sequence"],
        name: "uq_operator_vendor_sequence_order",
      },
      {
        fields: ["operatorId"],
        name: "idx_operator_vendor_sequence_operator_id",
      },
      {
        fields: ["vendorId"],
        name: "idx_operator_vendor_sequence_vendor_id",
      },
    ],
  }
);

// OperatorData → OperatorVendorSeqMapping
OperatorData.hasMany(OperatorVendorSeqMapping, {
  foreignKey: "operatorId",
  as: "vendorSequences",
});

OperatorVendorSeqMapping.belongsTo(OperatorData, {
  foreignKey: "operatorId",
  as: "operator",
});

// AvailableAPIs → OperatorVendorSeqMapping
AvailableAPIs.hasMany(OperatorVendorSeqMapping, {
  foreignKey: "vendorId",
  as: "operatorSequences",
});

OperatorVendorSeqMapping.belongsTo(AvailableAPIs, {
  foreignKey: "vendorId",
  as: "vendor",
});

module.exports = OperatorVendorSeqMapping;