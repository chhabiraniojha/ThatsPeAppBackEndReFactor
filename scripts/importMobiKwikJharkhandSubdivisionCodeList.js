const XLSX = require("xlsx");
const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const MobiKwikJharkhandSubdivisionCodeList = require(
  "../models/MobikwikModel/MobiKwikJharkhandSubdivisionCodeList"
);

const EXCEL_FILE =
  "./Formatted_Mobikwik_Operator_Sheet.xlsx";

const SHEET_NAME = "Subdivision code list for Jhark";

async function importJharkhandSubdivisionCodeList() {
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

      const UCODE = row["UCODE"];
      const NAME = row["NAME"];

      // Blank row skip
      if (
        (UCODE === null ||
          UCODE === undefined ||
          String(UCODE).trim() === "") &&
        (NAME === null ||
          NAME === undefined ||
          String(NAME).trim() === "")
      ) {
        continue;
      }

      // Dono source fields required hain
      if (
        UCODE === null ||
        UCODE === undefined ||
        String(UCODE).trim() === ""
      ) {
        console.warn("Skipping row because UCODE is missing:", row);
        continue;
      }

      if (
        NAME === null ||
        NAME === undefined ||
        String(NAME).trim() === ""
      ) {
        console.warn("Skipping row because NAME is missing:", row);
        continue;
      }

      records.push({
        id: crypto.randomUUID(),

        // Exact source values preserve
        UCODE: String(UCODE).trim(),
        NAME: String(NAME).trim(),
      });
    }

    console.log(`Actual rows to import: ${records.length}`);

    if (records.length === 0) {
      throw new Error(
        "No valid Jharkhand Subdivision records found."
      );
    }

    // Fresh import
    await MobiKwikJharkhandSubdivisionCodeList.destroy({
      where: {},
      truncate: true,
      transaction,
    });

    const BATCH_SIZE = 500;

    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await MobiKwikJharkhandSubdivisionCodeList.bulkCreate(
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
      "MobiKwik Jharkhand Subdivision Code List import SUCCESS"
    );
    console.log(`Total inserted: ${inserted}`);
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error(
      "MobiKwik Jharkhand Subdivision Code List import FAILED"
    );
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

importJharkhandSubdivisionCodeList();