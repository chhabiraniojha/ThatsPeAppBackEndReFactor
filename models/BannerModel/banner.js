const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const Banner = sequelize.define(
  "Banner",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    bannerImage: {
      type: DataTypes.STRING(500),
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
    tableName: "Banners",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["bannerImage"],
        name: "uq_banner_image",
      },
      {
        unique: true,
        fields: ["displayOrder"],
        name: "uq_banner_display_order",
      },
      {
        fields: ["status"],
        name: "idx_banner_status",
      },
    ],
  }
);

module.exports = Banner;