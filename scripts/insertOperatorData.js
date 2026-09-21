const crypto = require("crypto");
const sequelize = require("../util/db_connect");

const OperatorData = require("../models/OperatorDataModel/operatorData");
const SubCategory = require("../models/SubCategoryModel/subCategory");

const MobiKwikOperator = require(
    "../models/MobikwikModel/MobikwikOperator"
);

const MobiKwikCCBPBankList = require(
    "../models/MobikwikModel/MobikwikCCBPBankLIst"
);

const CHUNK_SIZE = 500;

async function insertOperatorData() {
    try {
        console.log("Reading MobiKwik data...");

        const [mobiOperators, ccbpOperators] = await Promise.all([
            MobiKwikOperator.findAll({ raw: true }),
            MobiKwikCCBPBankList.findAll({ raw: true }),
        ]);

        console.log(`MobiKwik Operator records : ${mobiOperators.length}`);
        console.log(`MobiKwik CCBP records     : ${ccbpOperators.length}`);

        // ---------------------------------------------------------
        // 1. LOAD SUBCATEGORIES
        // ---------------------------------------------------------
        const subCategories = await SubCategory.findAll({
            attributes: ["id", "name"],
            raw: true,
        });

        console.log(`SubCategories loaded: ${subCategories.length}`);

        const subCategoryMap = new Map();

        for (const subCategory of subCategories) {
            subCategoryMap.set(
                subCategory.name.trim().toLowerCase(),
                subCategory.id
            );
        }

        // ---------------------------------------------------------
        // 2. PREPARE ALL SOURCE RECORDS
        // ---------------------------------------------------------

        const sourceRecords = [];

        let fallbackBillerCounter = 1;

        // Main MobiKwik Operator
        for (const record of mobiOperators) {
            sourceRecords.push({
                source: "operator",
                sourceId: record.id,
                billerName: record.billerName,
                category: record.category,
                record,
            });
        }

        // CCBP
        for (const record of ccbpOperators) {
            sourceRecords.push({
                source: "ccbp",
                sourceId: record.id,
                billerName: record.billerName,
                category: record.category,
                record,
            });
        }

        // ---------------------------------------------------------
        // 3. CREATE OPERATOR DATA RECORDS
        // ---------------------------------------------------------

        const operatorDataRecords = [];

        for (const item of sourceRecords) {
            let billerName = item.billerName;

            // Completely blank row
            if (
                (billerName === null ||
                    billerName === undefined ||
                    String(billerName).trim() === "") &&
                (item.category === null ||
                    item.category === undefined ||
                    String(item.category).trim() === "")
            ) {
                console.log(
                    `Skipping completely blank source row: ${item.sourceId}`
                );

                continue;
            }

            // Category is mandatory because we cannot safely
            // determine subCategoryId without it.
            if (
                item.category === null ||
                item.category === undefined ||
                String(item.category).trim() === ""
            ) {
                throw new Error(
                    `Category missing for source record: ${item.sourceId}`
                );
            }

            // Missing biller name
            if (
                billerName === null ||
                billerName === undefined ||
                String(billerName).trim() === ""
            ) {
                billerName = `Some Biller ${fallbackBillerCounter++}`;

                console.log(
                    `Missing Biller Name -> ${billerName} | Source ID: ${item.sourceId}`
                );
            }

            const categoryName = String(item.category).trim().toLowerCase();

            const subCategoryId = subCategoryMap.get(categoryName);

            if (!subCategoryId) {
                throw new Error(
                    `SubCategory not found for category "${item.category}" | Source ID: ${item.sourceId}`
                );
            }

            operatorDataRecords.push({
                id: crypto.randomUUID(),
                name: String(billerName).trim(),

                // Existing OperatorData defaults
                discount: 0.0,
                discountType: "percentage",
                operatorImage: null,

                subCategoryId,

                status: "active",

                createdBy: null,
                updatedBy: null,

                // Temporary mapping information
                source: item.source,
                sourceId: item.sourceId,
            });
        }

        console.log(`Prepared OperatorData records: ${operatorDataRecords.length}`);

        // ---------------------------------------------------------
        // 4. INSERT OPERATOR DATA IN CHUNKS
        // ---------------------------------------------------------

        const insertedMappings = [];

        for (
            let start = 0;
            start < operatorDataRecords.length;
            start += CHUNK_SIZE
        ) {
            const chunk = operatorDataRecords.slice(
                start,
                start + CHUNK_SIZE
            );

            // Only send actual DB columns
            const dbRecords = chunk.map((item) => ({
                id: item.id,
                name: item.name,
                discount: item.discount,
                discountType: item.discountType,
                operatorImage: item.operatorImage,
                subCategoryId: item.subCategoryId,
                status: item.status,
                createdBy: item.createdBy,
                updatedBy: item.updatedBy,
            }));

            console.log(
                `Inserting OperatorData ${start + 1} - ${start + chunk.length
                } / ${operatorDataRecords.length}`
            );

            await OperatorData.bulkCreate(dbRecords, {
                validate: true,
            });

            for (const item of chunk) {
                insertedMappings.push(item);
            }
        }

        console.log("OperatorData insertion completed.");

        // ---------------------------------------------------------
        // 5. UPDATE MOBIKWIK OPERATOR operatorId
        // ---------------------------------------------------------

        const operatorMappings = insertedMappings.filter(
            (item) => item.source === "operator"
        );

        const ccbpMappings = insertedMappings.filter(
            (item) => item.source === "ccbp"
        );

        // ---------------------------------------------------------
        // 6. UPDATE MAIN MOBIKWIK OPERATOR TABLE
        // ---------------------------------------------------------

        console.log(
            `Updating MobiKwikOperators: ${operatorMappings.length}`
        );

        for (let start = 0; start < operatorMappings.length; start += CHUNK_SIZE) {
            const chunk = operatorMappings.slice(
                start,
                start + CHUNK_SIZE
            );

            const ids = chunk.map((item) => item.sourceId);

            const replacements = [];

            const caseParts = chunk.map((item) => {
                replacements.push(item.sourceId);
                replacements.push(item.id);

                return `WHEN ? THEN ?`;
            });

            const sql = `
        UPDATE MobiKwikOperators
        SET operatorId = CASE id
          ${caseParts.join("\n")}
        END
        WHERE id IN (${ids.map(() => "?").join(",")})
      `;

            replacements.push(...ids);

            await sequelize.query(sql, {
                replacements,
                type: sequelize.QueryTypes.UPDATE,
            });

            console.log(
                `MobiKwikOperators updated: ${Math.min(start + chunk.length, operatorMappings.length)
                } / ${operatorMappings.length}`
            );
        }

        // ---------------------------------------------------------
        // 7. UPDATE CCBP operatorId
        // ---------------------------------------------------------

        console.log(
            `Updating MobiKwikCCBPBankLists: ${ccbpMappings.length}`
        );

        for (let start = 0; start < ccbpMappings.length; start += CHUNK_SIZE) {
            const chunk = ccbpMappings.slice(
                start,
                start + CHUNK_SIZE
            );

            const ids = chunk.map((item) => item.sourceId);

            const replacements = [];

            const caseParts = chunk.map((item) => {
                replacements.push(item.sourceId);
                replacements.push(item.id);

                return `WHEN ? THEN ?`;
            });

            const sql = `
        UPDATE MobiKwikCCBPBankLists
        SET operatorId = CASE id
          ${caseParts.join("\n")}
        END
        WHERE id IN (${ids.map(() => "?").join(",")})
      `;

            replacements.push(...ids);

            await sequelize.query(sql, {
                replacements,
                type: sequelize.QueryTypes.UPDATE,
            });

            console.log(
                `MobiKwikCCBPBankLists updated: ${Math.min(start + chunk.length, ccbpMappings.length)
                } / ${ccbpMappings.length}`
            );
        }

        // ---------------------------------------------------------
        // 8. FINAL VERIFICATION
        // ---------------------------------------------------------

        const [operatorCount, ccbpCount] = await Promise.all([
            MobiKwikOperator.count({
                where: {
                    operatorId: {
                        [require("sequelize").Op.ne]: null,
                    },
                },
            }),

            MobiKwikCCBPBankList.count({
                where: {
                    operatorId: {
                        [require("sequelize").Op.ne]: null,
                    },
                },
            }),
        ]);

        console.log("");
        console.log("======================================");
        console.log("OPERATOR DATA IMPORT SUCCESS");
        console.log("======================================");
        console.log(`OperatorData inserted : ${operatorDataRecords.length}`);
        console.log(`MobiKwik mapped       : ${operatorCount}`);
        console.log(`CCBP mapped           : ${ccbpCount}`);
        console.log("======================================");
    } catch (error) {
        console.error("");
        console.error("OPERATOR DATA IMPORT FAILED");
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

insertOperatorData();