const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const MobiKwikHPCLDistributorList = require(
  "../models/MobikwikModel/MobiKwikHPCLDistributorList"
);

const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const SHEET_NAME = "HPCL Distributor List";

async function importHPCLDistributorList() {
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
      // Skip completely blank rows
      if (
        !row ||
        Object.values(row).every(
          (value) =>
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        )
      ) {
        continue;
      }

      const CODE = row["CODE"];
      const DISTRIBUTOR = row["DISTRIBUTOR"];
      const DISTRICT = row["DISTRICT"];
      const STATE = row["STATE"];

      // Required source fields
      if (
        CODE === null ||
        CODE === undefined ||
        String(CODE).trim() === ""
      ) {
        console.warn("Skipping row because CODE is missing:", row);
        continue;
      }

      if (
        DISTRIBUTOR === null ||
        DISTRIBUTOR === undefined ||
        String(DISTRIBUTOR).trim() === ""
      ) {
        console.warn("Skipping row because DISTRIBUTOR is missing:", row);
        continue;
      }

      if (
        DISTRICT === null ||
        DISTRICT === undefined ||
        String(DISTRICT).trim() === ""
      ) {
        console.warn("Skipping row because DISTRICT is missing:", row);
        continue;
      }

      if (
        STATE === null ||
        STATE === undefined ||
        String(STATE).trim() === ""
      ) {
        console.warn("Skipping row because STATE is missing:", row);
        continue;
      }

      records.push({
        id: crypto.randomUUID(),

        // Source values preserved as strings
        CODE: String(CODE).trim(),
        DISTRIBUTOR: String(DISTRIBUTOR).trim(),
        DISTRICT: String(DISTRICT).trim(),
        STATE: String(STATE).trim(),
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error("No valid HPCL distributor records found.");
    }

    // Fresh import
    await MobiKwikHPCLDistributorList.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikHPCLDistributorList.bulkCreate(batch, {
        transaction,
      });

      inserted += batch.length;

      console.log(`Inserted ${inserted}/${records.length}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log("MobiKwik HPCL Distributor import SUCCESS");
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error("MobiKwik HPCL Distributor import FAILED");
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importHPCLDistributorList();