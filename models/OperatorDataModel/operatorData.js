const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");
const SubCategory = require("../SubCategoryModel/subCategory");

const OperatorData = sequelize.define(
  "OperatorData",
  {
    // ThatsPe internal operator ID
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Common operator name used by ThatsPe
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // ThatsPe discount configuration
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    discountType: {
      type: DataTypes.ENUM("rupees", "percentage"),
      allowNull: false,
      defaultValue: "percentage",
    },

    // ThatsPe operator image
    operatorImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // ThatsPe service/subcategory
    subCategoryId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: SubCategory,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
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
    tableName: "OperatorData",
    timestamps: true,

    indexes: [
      {
        fields: ["name"],
        name: "idx_operator_data_name",
      },
      {
        fields: ["subCategoryId"],
        name: "idx_operator_data_subcategory_id",
      },
      {
        fields: ["status"],
        name: "idx_operator_data_status",
      },
    ],
  }
);

// SubCategory → OperatorData
SubCategory.hasMany(OperatorData, {
  foreignKey: "subCategoryId",
  as: "operators",
});

// OperatorData → SubCategory
OperatorData.belongsTo(SubCategory, {
  foreignKey: "subCategoryId",
  as: "subCategory",
});

module.exports = OperatorData;