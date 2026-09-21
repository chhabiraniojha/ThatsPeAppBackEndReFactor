const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikDistrictDiscom = sequelize.define(
  "MobiKwikDistrictDiscom",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source column
    districtDiscom: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "districtDiscom",
    },
  },
  {
    tableName: "MobiKwikDistrictDiscoms",
    timestamps: true,
  }
);

module.exports = MobiKwikDistrictDiscom;