const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");
const MobiKwikDistrictDiscom = require("../models/MobikwikModel/MobiKwikDistrictDiscom");

// Excel file path
const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

// Excel sheet name
const SHEET_NAME = "districtDiscom (UPPCL-Postpaid ";

async function importDistrictDiscom() {
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

      // Sheet me proper header nahi hai.
      // First cell hi actual source value hai.
      const sourceValue = row[0];

      if (
        sourceValue === null ||
        sourceValue === undefined ||
        String(sourceValue).trim() === ""
      ) {
        continue;
      }

      const districtDiscom = String(sourceValue).trim();

      records.push({
        id: crypto.randomUUID(),
        districtDiscom,
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error("No valid District/Discom records found.");
    }

    // Existing data ko duplicate import se bachane ke liye
    // pehle table clean karenge.
    await MobiKwikDistrictDiscom.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikDistrictDiscom.bulkCreate(batch, {
        transaction,
      });

      inserted += batch.length;

      console.log(`Inserted ${inserted}/${records.length}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log("MobiKwik District Discom import SUCCESS");
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error("MobiKwik District Discom import FAILED");
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importDistrictDiscom();