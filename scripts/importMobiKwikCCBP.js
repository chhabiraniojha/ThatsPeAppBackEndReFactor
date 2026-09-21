const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");

const sequelize = require("../util/db_connect");
const MobiKwikCCBPBankList = require("../models/MobikwikModel/MobikwikCCBPBankLIst");

// =========================================================
// CONFIG
// =========================================================

const EXCEL_FILE = path.join(
  __dirname,
  "../Formatted_Mobikwik_Operator_Sheet.xlsx"
);

const SHEET_NAME = "CCBP Bank List";

const BATCH_SIZE = 500;

// =========================================================
// HELPERS
// =========================================================

// Excel blank / undefined / empty string -> NULL
function normalizeValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return null;
    }

    return trimmed;
  }

  return value;
}

// Excel Optional values:
// False / TRUE / True / 0 / 1
// NULL remains NULL
function normalizeOptional(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 0) return false;
    if (value === 1) return true;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  if (normalized === "1") {
    return true;
  }

  if (normalized === "0") {
    return false;
  }

  return null;
}

// =========================================================
// EXACT EXCEL -> DB FIELD MAPPING
// =========================================================

const FIELD_MAP = {
  op: "op",
  billerName: "Biller Name",
  billerId: "Biller Id",
  category: "Category",
  bbpsEnabled: "BBPS Enabled",
  billFetchRequired: "Bill Fetch Required",
  cirId: "Cir_Id",
  amountExactness: "Amount_Exactness",
  paymentChannel: "Payment Channel",

  intChannelMin: "INT_Channel_Min  (in Paisa)",
  intChannelMax: "INT_Channel_Max  (in Paisa)",

  paymentModes: "Payment Modes",

  cashMin: "Cash_Min (in Paisa)",
  cashMax: "Cash_Max  (in Paisa)",

  creditCardMin: "CreditCard_Min (in Paisa)",
  creditCardMax: "CreditCard_Max  (in Paisa)",

  debitCardMin: "DebitCard_Min (in Paisa)",
  debitCardMax: "DebitCard_Max  (in Paisa)",

  internetBankingMin: "InternetBanking_Min (in Paisa)",
  internetBankingMax: "InternetBanking_Max  (in Paisa)",

  upiMin: "UPI_Min (in Paisa)",
  upiMax: "UPI_Max  (in Paisa)",

  walletMin: "Wallet_Min (in Paisa)",
  walletMax: "Wallet_Max  (in Paisa)",

  // =======================================================
  // PARAMETER 1
  // =======================================================

  parameter1Name: "Parameter_1_Name (cn)",
  param1Id: "Param_1_id",
  param1Regex: "Param_1_Regex",
  param1Optional: "Param_1_Optional",

  // =======================================================
  // PARAMETER 2
  // =======================================================

  param2Name: "Param_2_Name",
  param2Id: "Param_2_id",
  param2PaymentId: "Param_2_id for paymnents",
  param2Regex: "Param_2_Regex",
  param2Optional: "Param_2_Optional",

  // =======================================================
  // PARAMETER 3
  // =======================================================

  param3Name: "Param_3_Name",
  param3Id: "Param_3_id",
  param3PaymentId: "Param_3_id for payments",
  param3Regex: "Param_3_Regex",
  param3Optional: "Param_3_Optional",

  // =======================================================
  // PARAMETER 4
  // =======================================================

  param4Name: "Param_4_Name",
  param4Id: "Param_4_id",
  param4PaymentId: "Param_4_id for payments",
  param4Regex: "Param_4_Regex",
  param4Optional: "Param_4_Optional",

  // =======================================================
  // PARAMETER 5
  // =======================================================

  param5Name: "Param_5_Name",
  param5Id: "Param_5_id",
  param5PaymentId: "Param_5_id for payments",
  param5Regex: "Param_5_Regex",
  param5Optional: "Param_5_Optional",

  // =======================================================
  // PARAMETER 6
  // =======================================================

  param6Name: "Param_6_Name",
  param6Id: "Param_6_id",
  param6PaymentId: "Param_6_id for payments",
  param6Regex: "Param_6_Regex",
  param6Optional: "Param_6_Optional",

  // =======================================================
  // PARAMETER 7
  // =======================================================

  param7Name: "Param_7_Name",
  param7Id: "Param_7_id",
  param7PaymentId: "Param_7_id for payments",
  param7Regex: "Param_7_Regex",
  param7Optional: "Param_7_Optional",

  // =======================================================
  // PARAMETER 8
  // =======================================================

  param8Name: "Param_8_Name",
  param8Id: "Param_8_id",
  param8PaymentId: "Param_8_id for payments",
  param8Regex: "Param_8_Regex",
  param8Optional: "Param_8_Optional",

  // =======================================================
  // PARAMETER 9
  // =======================================================

  param9Name: "Param_9_Name",
  param9Id: "Param_9_id",
  param9PaymentId: "Param_9_id for payments",
  param9Regex: "Param_9_Regex",
  param9Optional: "Param_9_Optional",

  // =======================================================
  // PARAMETER 10
  // =======================================================

  param10Name: "Param_10_Name",
  param10Id: "Param_10_id",
  param10PaymentId: "Param_10_id for payments",
  param10Regex: "Param_10_Regex",
  param10Optional: "Param_10_Optional",
};

// =========================================================
// MAIN
// =========================================================

async function importCCBP() {
  let transaction;

  try {
    // -------------------------------------------------------
    // CHECK FILE
    // -------------------------------------------------------

    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(`Excel file not found: ${EXCEL_FILE}`);
    }

    console.log("Reading Excel...");
    console.log(`File: ${EXCEL_FILE}`);
    console.log(`Sheet: ${SHEET_NAME}`);

    // -------------------------------------------------------
    // READ EXCEL
    // -------------------------------------------------------

    const workbook = XLSX.readFile(EXCEL_FILE, {
      cellDates: false,
      raw: true,
    });

    if (!workbook.SheetNames.includes(SHEET_NAME)) {
      throw new Error(
        `Sheet "${SHEET_NAME}" not found in Excel file`
      );
    }

    const worksheet = workbook.Sheets[SHEET_NAME];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: true,
    });

    console.log(`Total Excel rows found: ${rows.length}`);

    // -------------------------------------------------------
    // PREPARE RECORDS
    // -------------------------------------------------------

    const records = [];

    for (const row of rows) {
      // Skip completely blank rows
      const hasData = Object.values(row).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      );

      if (!hasData) {
        continue;
      }

      const record = {
        // Internal ThatsPe ID
        id: crypto.randomUUID(),

        // Will be mapped later
        operatorId: null,
      };

      // -----------------------------------------------------
      // COPY ALL SOURCE FIELDS
      // -----------------------------------------------------

      for (const [dbField, excelField] of Object.entries(FIELD_MAP)) {
        const value = row[excelField];

        if (
          dbField.endsWith("Optional")
        ) {
          record[dbField] = normalizeOptional(value);
        } else {
          record[dbField] = normalizeValue(value);
        }
      }

      records.push(record);
    }

    console.log(`Actual rows to import: ${records.length}`);

    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (records.length === 0) {
      throw new Error("No valid records found in CCBP Bank List");
    }

    // CCBP sheet expected to contain op 208
    const unexpectedOps = [
      ...new Set(
        records
          .map((row) => row.op)
          .filter((op) => op !== null && op !== "208" && op !== 208)
      ),
    ];

    if (unexpectedOps.length > 0) {
      throw new Error(
        `Unexpected op value(s) found in CCBP sheet: ${unexpectedOps.join(", ")}`
      );
    }

    // -------------------------------------------------------
    // IMPORTANT DATA CHECKS
    // -------------------------------------------------------

    const missingBillerIds = records.filter(
      (row) => !row.billerId
    );

    if (missingBillerIds.length > 0) {
      console.warn(
        `WARNING: ${missingBillerIds.length} records have missing Biller Id`
      );
    }

    const missingBillerNames = records.filter(
      (row) => !row.billerName
    );

    if (missingBillerNames.length > 0) {
      console.warn(
        `WARNING: ${missingBillerNames.length} records have missing Biller Name`
      );
    }

    console.log(`Prepared records: ${records.length}`);

    // -------------------------------------------------------
    // DB CONNECTION
    // -------------------------------------------------------

    await sequelize.authenticate();

    console.log("Database connection established.");

    // -------------------------------------------------------
    // TRANSACTION
    // -------------------------------------------------------

    transaction = await sequelize.transaction();

    // -------------------------------------------------------
    // INSERT IN BATCHES
    // -------------------------------------------------------

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(
        i,
        i + BATCH_SIZE
      );

      await MobiKwikCCBPBankList.bulkCreate(batch, {
        transaction,
        validate: true,
      });

      console.log(
        `Inserted ${Math.min(
          i + batch.length,
          records.length
        )}/${records.length}`
      );
    }

    // -------------------------------------------------------
    // COMMIT
    // -------------------------------------------------------

    await transaction.commit();

    transaction = null;

    console.log("=================================");
    console.log("MobiKwik CCBP import SUCCESS");
    console.log(`Total inserted: ${records.length}`);
    console.log("operatorId: NULL");
    console.log("=================================");
  } catch (error) {
    console.error("=================================");
    console.error("MobiKwik CCBP import FAILED");
    console.error("=================================");
    console.error(error);

    if (transaction) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back.");
      } catch (rollbackError) {
        console.error(
          "Rollback failed:",
          rollbackError
        );
      }
    }

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// =========================================================
// RUN
// =========================================================

importCCBP();