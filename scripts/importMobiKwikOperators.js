const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");
const MobiKwikOperator = require("../models/MobikwikModel/MobikwikOperator");

// Excel file ka path
const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const BATCH_SIZE = 500;

// Excel ke exact 73 columns
const COLUMNS = [
  "op",
  "Biller Name",
  "Biller Id",
  "Category",
  "BBPS Enabled",
  "Bill Fetch Required",
  "Cir_Id",
  "Amount_Exactness",
  "Payment Channel",
  "INT_Channel_Min  (in Paisa)",
  "INT_Channel_Max  (in Paisa)",
  "Payment Modes",
  "Cash_Min (in Paisa)",
  "Cash_Max  (in Paisa)",
  "CreditCard_Min (in Paisa)",
  "CreditCard_Max  (in Paisa)",
  "DebitCard_Min  (in Paisa)",
  "DebitCard_Max  (in Paisa)",
  "InternetBanking_Min  (in Paisa)",
  "InternetBanking_Max  (in Paisa)",
  "UPI_Min  (in Paisa)",
  "UPI_Max  (in Paisa)",
  "Wallet_Min  (in Paisa)",
  "Wallet_Max  (in Paisa)",
  "Parameter_1_Name (cn)",
  "Param_1_id",
  "Param_1_Regex",
  "Param_1_Optional",
  "Param_2_Name",
  "Param_2_id",
  "Param_2_id for paymnents",
  "Param_2_Regex",
  "Param_2_Optional",
  "Param_3_Name",
  "Param_3_id",
  "Param_3_id for payments",
  "Param_3_Regex",
  "Param_3_Optional",
  "Param_4_Name",
  "Param_4_id",
  "Param_4_id for payments",
  "Param_4_Regex",
  "Param_4_Optional",
  "Param_5_Name",
  "Param_5_id",
  "Param_5_id for payments",
  "Param_5_Regex",
  "Param_5_Optional",
  "Param_6_Name",
  "Param_6_id",
  "Param_6_id for payments",
  "Param_6_Regex",
  "Param_6_Optional",
  "Param_7_Name",
  "Param_7_id",
  "Param_7_id for payments",
  "Param_7_Regex",
  "Param_7_Optional",
  "Param_8_Name",
  "Param_8_id",
  "Param_8_id for payments",
  "Param_8_Regex",
  "Param_8_Optional",
  "Param_9_Name",
  "Param_9_id",
  "Param_9_id for payments",
  "Param_9_Regex",
  "Param_9_Optional",
  "Param_10_Name",
  "Param_10_id",
  "Param_10_id for payments",
  "Param_10_Regex",
  "Param_10_Optional",
];

// Excel column -> Sequelize attribute
const FIELD_MAP = {
  "op": "op",
  "Biller Name": "billerName",
  "Biller Id": "billerId",
  "Category": "category",
  "BBPS Enabled": "bbpsEnabled",
  "Bill Fetch Required": "billFetchRequired",
  "Cir_Id": "cirId",
  "Amount_Exactness": "amountExactness",
  "Payment Channel": "paymentChannel",
  "INT_Channel_Min  (in Paisa)": "intChannelMin",
  "INT_Channel_Max  (in Paisa)": "intChannelMax",
  "Payment Modes": "paymentModes",

  "Cash_Min (in Paisa)": "cashMin",
  "Cash_Max  (in Paisa)": "cashMax",

  "CreditCard_Min (in Paisa)": "creditCardMin",
  "CreditCard_Max  (in Paisa)": "creditCardMax",

  "DebitCard_Min  (in Paisa)": "debitCardMin",
  "DebitCard_Max  (in Paisa)": "debitCardMax",

  "InternetBanking_Min  (in Paisa)": "internetBankingMin",
  "InternetBanking_Max  (in Paisa)": "internetBankingMax",

  "UPI_Min  (in Paisa)": "upiMin",
  "UPI_Max  (in Paisa)": "upiMax",

  "Wallet_Min  (in Paisa)": "walletMin",
  "Wallet_Max  (in Paisa)": "walletMax",

  "Parameter_1_Name (cn)": "param1Name",
  "Param_1_id": "param1Id",
  "Param_1_Regex": "param1Regex",
  "Param_1_Optional": "param1Optional",

  "Param_2_Name": "param2Name",
  "Param_2_id": "param2Id",
  "Param_2_id for paymnents": "param2PaymentId",
  "Param_2_Regex": "param2Regex",
  "Param_2_Optional": "param2Optional",

  "Param_3_Name": "param3Name",
  "Param_3_id": "param3Id",
  "Param_3_id for payments": "param3PaymentId",
  "Param_3_Regex": "param3Regex",
  "Param_3_Optional": "param3Optional",

  "Param_4_Name": "param4Name",
  "Param_4_id": "param4Id",
  "Param_4_id for payments": "param4PaymentId",
  "Param_4_Regex": "param4Regex",
  "Param_4_Optional": "param4Optional",

  "Param_5_Name": "param5Name",
  "Param_5_id": "param5Id",
  "Param_5_id for payments": "param5PaymentId",
  "Param_5_Regex": "param5Regex",
  "Param_5_Optional": "param5Optional",

  "Param_6_Name": "param6Name",
  "Param_6_id": "param6Id",
  "Param_6_id for payments": "param6PaymentId",
  "Param_6_Regex": "param6Regex",
  "Param_6_Optional": "param6Optional",

  "Param_7_Name": "param7Name",
  "Param_7_id": "param7Id",
  "Param_7_id for payments": "param7PaymentId",
  "Param_7_Regex": "param7Regex",
  "Param_7_Optional": "param7Optional",

  "Param_8_Name": "param8Name",
  "Param_8_id": "param8Id",
  "Param_8_id for payments": "param8PaymentId",
  "Param_8_Regex": "param8Regex",
  "Param_8_Optional": "param8Optional",

  "Param_9_Name": "param9Name",
  "Param_9_id": "param9Id",
  "Param_9_id for payments": "param9PaymentId",
  "Param_9_Regex": "param9Regex",
  "Param_9_Optional": "param9Optional",

  "Param_10_Name": "param10Name",
  "Param_10_id": "param10Id",
  "Param_10_id for payments": "param10PaymentId",
  "Param_10_Regex": "param10Regex",
  "Param_10_Optional": "param10Optional",
};

function normalizeValue(value) {
  // Completely empty Excel cell
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return value;
}

function normalizeOptional(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value === true || value === "True" || value === "TRUE") {
    return true;
  }

  if (value === false || value === "False" || value === "FALSE") {
    return false;
  }

  // Excel me kuch rows 0 / 0.0 ke form me aaye hain
  if (value === 0 || value === 0.0 || value === "0" || value === "0.0") {
    return false;
  }

  if (value === 1 || value === 1.0 || value === "1" || value === "1.0") {
    return true;
  }

  return null;
}

function isActualRow(row) {
  return COLUMNS.some((column) => {
    const value = row[column];

    return (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    );
  });
}

async function importData() {
  try {
    console.log("Reading Excel...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const sheet = workbook.Sheets["Operator"];

    if (!sheet) {
      throw new Error('Excel sheet "Operator" not found');
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: true,
    });

    console.log(`Total Excel rows found: ${rows.length}`);

    const actualRows = rows.filter(isActualRow);

    console.log(`Actual rows to import: ${actualRows.length}`);

    const records = [];

    for (const row of actualRows) {
      const record = {
        // Generated internally
        id: crypto.randomUUID(),

        // Abhi mapping nahi hui hai
        operatorId: null,
      };

      for (const column of COLUMNS) {
        const attribute = FIELD_MAP[column];

        if (!attribute) {
          throw new Error(
            `FIELD_MAP missing for Excel column: ${column}`
          );
        }

        if (
          column === "Param_1_Optional" ||
          column === "Param_2_Optional" ||
          column === "Param_3_Optional" ||
          column === "Param_4_Optional" ||
          column === "Param_5_Optional" ||
          column === "Param_6_Optional" ||
          column === "Param_7_Optional" ||
          column === "Param_8_Optional" ||
          column === "Param_9_Optional" ||
          column === "Param_10_Optional"
        ) {
          record[attribute] = normalizeOptional(row[column]);
        } else {
          record[attribute] = normalizeValue(row[column]);
        }
      }

      records.push(record);
    }

    console.log(`Prepared records: ${records.length}`);

    // Safety check
    if (!records.length) {
      throw new Error("No valid records found in Excel");
    }

    const transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        await MobiKwikOperator.bulkCreate(batch, {
          transaction,
        });

        console.log(
          `Inserted ${Math.min(
            i + BATCH_SIZE,
            records.length
          )}/${records.length}`
        );
      }

      await transaction.commit();

      console.log("=================================");
      console.log("MobiKwik Operator import SUCCESS");
      console.log(`Total inserted: ${records.length}`);
      console.log("operatorId: NULL");
      console.log("=================================");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("MobiKwik import FAILED");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importData();