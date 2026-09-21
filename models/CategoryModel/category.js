const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "Categories",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["categoryName"],
        name: "uq_category_name",
      },
      {
        unique: true,
        fields: ["displayOrder"],
        name: "uq_category_display_order",
      },
      {
        fields: ["categoryName"],
      },
      {
        fields: ["displayOrder"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = Category;