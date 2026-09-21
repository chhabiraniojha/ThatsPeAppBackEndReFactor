const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");
const Category = require("../CategoryModel/category");

const SubCategory = sequelize.define(
  "SubCategory",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    categoryId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Category,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    icon: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },

    popular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "SubCategories",
    timestamps: true,

    indexes: [
      {
        fields: ["categoryId"],
        name: "idx_subcategory_category_id",
      },
      {
        fields: ["name"],
        name: "idx_subcategory_name",
      },
      {
        fields: ["status"],
        name: "idx_subcategory_status",
      },
      {
        fields: ["popular"],
        name: "idx_subcategory_popular",
      },
      {
        fields: ["displayOrder"],
        name: "idx_subcategory_display_order",
      },
    ],
  }
);

Category.hasMany(SubCategory, {
  foreignKey: "categoryId",
  as: "subCategories",
});

SubCategory.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

module.exports = SubCategory;