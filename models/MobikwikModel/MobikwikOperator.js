const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const OperatorData = require("../OperatorDataModel/operatorData");

const MobiKwikOperator = sequelize.define(
  "MobiKwikOperator",
  {
    // Internal ThatsPe record ID
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // ThatsPe common OperatorData reference
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
    // MOBIKWIK EXCEL - OPERATOR SHEET
    // EXACT 73 SOURCE COLUMNS
    // =========================================================

    // 1
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

    // 10
    intChannelMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "INT_Channel_Min  (in Paisa)",
    },

    // 11
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

    // 13
    cashMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Cash_Min (in Paisa)",
    },

    // 14
    cashMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Cash_Max  (in Paisa)",
    },

    // 15
    creditCardMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "CreditCard_Min (in Paisa)",
    },

    // 16
    creditCardMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "CreditCard_Max  (in Paisa)",
    },

    // 17
    debitCardMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "DebitCard_Min  (in Paisa)",
    },

    // 18
    debitCardMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "DebitCard_Max  (in Paisa)",
    },

    // 19
    internetBankingMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "InternetBanking_Min  (in Paisa)",
    },

    // 20
    internetBankingMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "InternetBanking_Max  (in Paisa)",
    },

    // 21
    upiMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "UPI_Min  (in Paisa)",
    },

    // 22
    upiMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "UPI_Max  (in Paisa)",
    },

    // 23
    walletMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Wallet_Min  (in Paisa)",
    },

    // 24
    walletMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "Wallet_Max  (in Paisa)",
    },

    // =========================================================
    // PARAMETER 1
    // =========================================================

    // 25
    param1Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Parameter_1_Name (cn)",
    },

    // 26
    param1Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_1_id",
    },

    // 27
    param1Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_1_Regex",
    },

    // 28
    param1Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_1_Optional",
    },

    // =========================================================
    // PARAMETER 2
    // =========================================================

    // 29
    param2Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_2_Name",
    },

    // 30
    param2Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_2_id",
    },

    // 31
    param2PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_2_id for paymnents",
    },

    // 32
    param2Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_2_Regex",
    },

    // 33
    param2Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_2_Optional",
    },

    // =========================================================
    // PARAMETER 3
    // =========================================================

    // 34
    param3Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_3_Name",
    },

    // 35
    param3Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_3_id",
    },

    // 36
    param3PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_3_id for payments",
    },

    // 37
    param3Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_3_Regex",
    },

    // 38
    param3Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_3_Optional",
    },

    // =========================================================
    // PARAMETER 4
    // =========================================================

    // 39
    param4Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_4_Name",
    },

    // 40
    param4Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_4_id",
    },

    // 41
    param4PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_4_id for payments",
    },

    // 42
    param4Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_4_Regex",
    },

    // 43
    param4Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_4_Optional",
    },

    // =========================================================
    // PARAMETER 5
    // =========================================================

    // 44
    param5Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_5_Name",
    },

    // 45
    param5Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_5_id",
    },

    // 46
    param5PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_5_id for payments",
    },

    // 47
    param5Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_5_Regex",
    },

    // 48
    param5Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_5_Optional",
    },

    // =========================================================
    // PARAMETER 6
    // =========================================================

    // 49
    param6Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_6_Name",
    },

    // 50
    param6Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_6_id",
    },

    // 51
    param6PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_6_id for payments",
    },

    // 52
    param6Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_6_Regex",
    },

    // 53
    param6Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_6_Optional",
    },

    // =========================================================
    // PARAMETER 7
    // =========================================================

    // 54
    param7Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_7_Name",
    },

    // 55
    param7Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_7_id",
    },

    // 56
    param7PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_7_id for payments",
    },

    // 57
    param7Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_7_Regex",
    },

    // 58
    param7Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_7_Optional",
    },

    // =========================================================
    // PARAMETER 8
    // =========================================================

    // 59
    param8Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_8_Name",
    },

    // 60
    param8Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_8_id",
    },

    // 61
    param8PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_8_id for payments",
    },

    // 62
    param8Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_8_Regex",
    },

    // 63
    param8Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_8_Optional",
    },

    // =========================================================
    // PARAMETER 9
    // =========================================================

    // 64
    param9Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_9_Name",
    },

    // 65
    param9Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_9_id",
    },

    // 66
    param9PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_9_id for payments",
    },

    // 67
    param9Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_9_Regex",
    },

    // 68
    param9Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_9_Optional",
    },

    // =========================================================
    // PARAMETER 10
    // =========================================================

    // 69
    param10Name: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_10_Name",
    },

    // 70
    param10Id: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_10_id",
    },

    // 71
    param10PaymentId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_10_id for payments",
    },

    // 72
    param10Regex: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "Param_10_Regex",
    },

    // 73
    param10Optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "Param_10_Optional",
    },
  },

  {
    tableName: "MobiKwikOperators",
    timestamps: true,
  }
);

// =============================================================
// ASSOCIATIONS
// =============================================================

OperatorData.hasMany(MobiKwikOperator, {
  foreignKey: "operatorId",
  as: "mobiKwikOperators",
});

MobiKwikOperator.belongsTo(OperatorData, {
  foreignKey: "operatorId",
  as: "operator",
});

module.exports = MobiKwikOperator;