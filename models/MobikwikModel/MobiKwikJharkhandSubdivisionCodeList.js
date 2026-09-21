const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikJharkhandSubdivisionCodeList = sequelize.define(
  "MobiKwikJharkhandSubdivisionCodeList",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source column
    UCODE: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "UCODE",
    },

    // Exact Excel source column
    NAME: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "NAME",
    },
  },
  {
    tableName: "MobiKwikJharkhandSubdivisionCodeLists",
    timestamps: true,
  }
);

module.exports = MobiKwikJharkhandSubdivisionCodeList;