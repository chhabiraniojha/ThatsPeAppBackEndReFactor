const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikMadhyaPradeshUrban = sequelize.define(
  "MobiKwikMadhyaPradeshUrban",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source value
    "Madhya Pradesh Urban": {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "Madhya Pradesh Urban",
    },
  },
  {
    tableName: "MobiKwikMadhyaPradeshUrbans",
    timestamps: true,
  }
);

module.exports = MobiKwikMadhyaPradeshUrban;