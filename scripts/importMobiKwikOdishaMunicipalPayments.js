const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const MobiKwikOdishaMunicipalPayments = require(
  "../models/MobikwikModel/MobiKwikOdishaMunicipalPayments"
);

const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const SHEET_NAME = "Odisha Municipal Payments";

async function importOdishaMunicipalPayments() {
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

      const ulbName = row["ULB Name"];

      // Blank row skip
      if (
        ulbName === null ||
        ulbName === undefined ||
        String(ulbName).trim() === ""
      ) {
        continue;
      }

      records.push({
        id: crypto.randomUUID(),

        // Exact Excel source value
        "ULB Name": String(ulbName).trim(),
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error(
        "No valid Odisha Municipal Payment records found."
      );
    }

    // Fresh import
    await MobiKwikOdishaMunicipalPayments.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikOdishaMunicipalPayments.bulkCreate(batch, {
        transaction,
      });

      inserted += batch.length;

      console.log(`Inserted ${inserted}/${records.length}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log(
      "MobiKwik Odisha Municipal Payments import SUCCESS"
    );
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error(
      "MobiKwik Odisha Municipal Payments import FAILED"
    );
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importOdishaMunicipalPayments();