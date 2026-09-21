const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const MobiKwikShriramGeneralInsuranceQuotePay = sequelize.define(
  "MobiKwikShriramGeneralInsuranceQuotePay",
  {
    // ThatsPe internal primary key
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // Exact Excel source column
    "Product Code": {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "Product Code",
    },
  },
  {
    tableName: "MobiKwikShriramGeneralInsuranceQuotePays",
    timestamps: true,
  }
);

module.exports = MobiKwikShriramGeneralInsuranceQuotePay;