const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikOdishaMunicipalPayments = sequelize.define(
  "MobiKwikOdishaMunicipalPayments",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source column
    "ULB Name": {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "ULB Name",
    },
  },
  {
    tableName: "MobiKwikOdishaMunicipalPayments",
    timestamps: true,
  }
);

module.exports = MobiKwikOdishaMunicipalPayments;