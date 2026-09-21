const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikHPCLDistributorList = sequelize.define(
  "MobiKwikHPCLDistributorList",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source column
    CODE: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "CODE",
    },

    // Exact Excel source column
    DISTRIBUTOR: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "DISTRIBUTOR",
    },

    // Exact Excel source column
    DISTRICT: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "DISTRICT",
    },

    // Exact Excel source column
    STATE: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "STATE",
    },
  },
  {
    tableName: "MobiKwikHPCLDistributorLists",
    timestamps: true,
  }
);

module.exports = MobiKwikHPCLDistributorList;