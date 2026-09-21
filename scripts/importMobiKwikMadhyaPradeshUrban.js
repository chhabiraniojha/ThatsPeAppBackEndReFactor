const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const MobiKwikMadhyaPradeshUrban = require(
  "../models/MobikwikModel/MobiKwikMadhyaPradeshUrban"
);

const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const SHEET_NAME = "Madhya Pradesh Urban (e-Nagarpa";

async function importMadhyaPradeshUrban() {
  const transaction = await sequelize.transaction();

  try {
    console.log("Reading Excel...");

    const workbook = XLSX.readFile(EXCEL_FILE);

    const worksheet = workbook.Sheets[SHEET_NAME];

    if (!worksheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: false,
    });

    console.log(`Total Excel rows found: ${rows.length}`);

    const records = [];

    for (const row of rows) {
      if (!row || row.length === 0) {
        continue;
      }

      // Is sheet me proper header nahi hai.
      // First cell hi actual source value hai.
      const sourceValue = row[0];

      // Blank row skip
      if (
        sourceValue === null ||
        sourceValue === undefined ||
        String(sourceValue).trim() === ""
      ) {
        continue;
      }

      records.push({
        id: crypto.randomUUID(),

        // Exact source value preserve
        "Madhya Pradesh Urban": String(sourceValue).trim(),
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error(
        "No valid Madhya Pradesh Urban records found."
      );
    }

    // Fresh import
    await MobiKwikMadhyaPradeshUrban.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikMadhyaPradeshUrban.bulkCreate(batch, {
        transaction,
      });

      inserted += batch.length;

      console.log(`Inserted ${inserted}/${records.length}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log(
      "MobiKwik Madhya Pradesh Urban import SUCCESS"
    );
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error(
      "MobiKwik Madhya Pradesh Urban import FAILED"
    );
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importMadhyaPradeshUrban();