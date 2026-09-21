const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const OperatorData = require("../OperatorDataModel/operatorData");

const MobiKwikCCBPBankList = sequelize.define(
  "MobiKwikCCBPBankList",
  {
    // =========================================================
    // INTERNAL THATSPE ID
    // =========================================================
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // =========================================================
    // THATSPE COMMON OPERATOR REFERENCE
    // Initially NULL during Excel import.
    // Later mapped with OperatorData.id
    // =========================================================
    operatorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: OperatorData,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    // =========================================================
    // 1. op
    // Vendor-side MobiKwik operator code
    // CCBP sheet: 208
    // =========================================================
    op: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "op",
    },

    // 2
    billerName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Biller Name",
    },

    // 3
    billerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Biller Id",
    },

    // 4
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Category",
    },

    // 5
    bbpsEnabled: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "BBPS Enabled",
    },

    // 6
    billFetchRequired: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Bill Fetch Required",
    },

    // 7
    cirId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Cir_Id",
    },

    // 8
    amountExactness: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Amount_Exactness",
    },

    // 9
    paymentChannel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Payment Channel",
    },

    // =========================================================
    // 10-11
    // INTERNET BANKING CHANNEL
    // =========================================================

    intChannelMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "INT_Channel_Min  (in Paisa)",
    },

    intChannelMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "INT_Channel_Max  (in Paisa)",
    },

    // 12
    paymentModes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Payment Modes",
    },

    // =========================================================
    // 13-14 CASH
    // =========================================================

    cashMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Cash_Min (in Paisa)",
    },

    cashMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Cash_Max  (in Paisa)",
    },

    // =========================================================
    // 15-16 CREDIT CARD
    // =========================================================

    creditCardMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "CreditCard_Min (in Paisa)",
    },

    creditCardMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "CreditCard_Max  (in Paisa)",
    },

    // =========================================================
    // 17-18 DEBIT CARD
    // =========================================================

    debitCardMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "DebitCard_Min (in Paisa)",
    },

    debitCardMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "DebitCard_Max  (in Paisa)",
    },

    // =========================================================
    // 19-20 INTERNET BANKING
    // =========================================================

    internetBankingMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "InternetBanking_Min (in Paisa)",
    },

    internetBankingMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "InternetBanking_Max  (in Paisa)",
    },

    // =========================================================
    // 21-22 UPI
    // =========================================================

    upiMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "UPI_Min (in Paisa)",
    },

    upiMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "UPI_Max  (in Paisa)",
    },

    // =========================================================
    // 23-24 WALLET
    // =========================================================

    walletMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Wallet_Min (in Paisa)",
    },

    walletMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Wallet_Max  (in Paisa)",
    },

    // =========================================================
    // PARAMETER 1
    // =========================================================

    parameter1Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Parameter_1_Name (cn)",
    },

    param1Id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_1_id",
    },

    param1Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_1_Regex",
    },

    param1Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_1_Optional",
    },

    // =========================================================
    // PARAMETER 2
    // =========================================================

    param2Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_2_Name",
    },

    param2Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_2_id",
    },

    param2PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_2_id for paymnents",
    },

    param2Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_2_Regex",
    },

    param2Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_2_Optional",
    },

    // =========================================================
    // PARAMETER 3
    // =========================================================

    param3Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_3_Name",
    },

    param3Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_3_id",
    },

    param3PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_3_id for payments",
    },

    param3Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_3_Regex",
    },

    param3Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_3_Optional",
    },

    // =========================================================
    // PARAMETER 4
    // =========================================================

    param4Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_4_Name",
    },

    param4Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_4_id",
    },

    param4PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_4_id for payments",
    },

    param4Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_4_Regex",
    },

    param4Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_4_Optional",
    },

    // =========================================================
    // PARAMETER 5
    // =========================================================

    param5Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_5_Name",
    },

    param5Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_5_id",
    },

    param5PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_5_id for payments",
    },

    param5Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_5_Regex",
    },

    param5Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_5_Optional",
    },

    // =========================================================
    // PARAMETER 6
    // =========================================================

    param6Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_6_Name",
    },

    param6Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_6_id",
    },

    param6PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_6_id for payments",
    },

    param6Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_6_Regex",
    },

    param6Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_6_Optional",
    },

    // =========================================================
    // PARAMETER 7
    // =========================================================

    param7Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_7_Name",
    },

    param7Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_7_id",
    },

    param7PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_7_id for payments",
    },

    param7Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_7_Regex",
    },

    param7Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_7_Optional",
    },

    // =========================================================
    // PARAMETER 8
    // =========================================================

    param8Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_8_Name",
    },

    param8Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_8_id",
    },

    param8PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_8_id for payments",
    },

    param8Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_8_Regex",
    },

    param8Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_8_Optional",
    },

    // =========================================================
    // PARAMETER 9
    // =========================================================

    param9Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_9_Name",
    },

    param9Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_9_id",
    },

    param9PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_9_id for payments",
    },

    param9Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_9_Regex",
    },

    param9Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_9_Optional",
    },

    // =========================================================
    // PARAMETER 10
    // =========================================================

    param10Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_10_Name",
    },

    param10Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "Param_10_id",
    },

    param10PaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "Param_10_id for payments",
    },

    param10Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_10_Regex",
    },

    param10Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_10_Optional",
    },
  },
  {
    tableName: "MobiKwikCCBPBankLists",
    timestamps: true,
  }
);

// =========================================================
// ASSOCIATION
// =========================================================

OperatorData.hasMany(MobiKwikCCBPBankList, {
  foreignKey: "operatorId",
  as: "mobiKwikCCBPBankLists",
});

MobiKwikCCBPBankList.belongsTo(OperatorData, {
  foreignKey: "operatorId",
  as: "operator",
});

module.exports = MobiKwikCCBPBankList;