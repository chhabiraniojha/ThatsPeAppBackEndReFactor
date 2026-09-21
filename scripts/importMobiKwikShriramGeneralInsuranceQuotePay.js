const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const MobiKwikShriramGeneralInsuranceQuotePay = require(
  "../models/MobikwikModel/MobiKwikShriramGeneralInsuranceQuotePay"
);

const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const SHEET_NAME = "ShriramGeneralInsuranceQuotePay";

async function importShriramGeneralInsuranceQuotePay() {
  const transaction = await sequelize.transaction();

  try {
    console.log("Reading Excel...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const worksheet = workbook.Sheets[SHEET_NAME];

    if (!worksheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
    });

    console.log(`Total Excel rows found: ${rows.length}`);

    const records = [];

    for (const row of rows) {
      if (!row) {
        continue;
      }

      const productCode = row["Product Code"];

      // Skip blank rows
      if (
        productCode === null ||
        productCode === undefined ||
        String(productCode).trim() === ""
      ) {
        continue;
      }

      records.push({
        id: crypto.randomUUID(),

        // Exact source value preserve karna hai
        "Product Code": String(productCode).trim(),
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error(
        "No valid Shriram General Insurance Product Code records found."
      );
    }

    // Fresh import
    await MobiKwikShriramGeneralInsuranceQuotePay.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikShriramGeneralInsuranceQuotePay.bulkCreate(
        batch,
        {
          transaction,
        }
      );

      inserted += batch.length;

      console.log(`Inserted ${inserted}/${records.length}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log(
      "MobiKwik Shriram General Insurance Quote Pay import SUCCESS"
    );
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error(
      "MobiKwik Shriram General Insurance Quote Pay import FAILED"
    );
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importShriramGeneralInsuranceQuotePay();