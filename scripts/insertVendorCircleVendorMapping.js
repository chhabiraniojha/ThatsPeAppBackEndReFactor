const { randomUUID } = require("crypto");

const sequelize = require("../util/db_connect");

const CircleData = require("../models/CircleDataModel/circleData");
const CircleVendorMapping = require("../models/CircleDataModel/CircleVendorMapping");
const AvailableAPIs = require("../models/APIModels/api");


const circleMappings = [
    {
        circleId: "1",
        circleCode: "1",
    },
    {
        circleId: "2",
        circleCode: "2",
    },
    {
        circleId: "3",
        circleCode: "3",
    },
    {
        circleId: "4",
        circleCode: "4",
    },
    {
        circleId: "5",
        circleCode: "5",
    },
    {
        circleId: "6",
        circleCode: "6",
    },
    {
        circleId: "7",
        circleCode: "7",
    },
    {
        circleId: "8",
        circleCode: "8",
    },
    {
        circleId: "9",
        circleCode: "9",
    },
    {
        circleId: "10",
        circleCode: "10",
    },
    {
        circleId: "11",
        circleCode: "11",
    },
    {
        circleId: "12",
        circleCode: "12",
    },
    {
        circleId: "13",
        circleCode: "13",
    },
    {
        circleId: "14",
        circleCode: "14",
    },
    {
        circleId: "15",
        circleCode: "15",
    },
    {
        circleId: "16",
        circleCode: "16",
    },
    {
        circleId: "17",
        circleCode: "17",
    },
    {
        circleId: "18",
        circleCode: "18",
    },
    {
        circleId: "19",
        circleCode: "19",
    },
    {
        circleId: "20",
        circleCode: "20",
    },
    {
        circleId: "21",
        circleCode: "21",
    },
    {
        circleId: "22",
        circleCode: "22",
    },
    {
        circleId: "23",
        circleCode: "23",
    },
];


const insertCircleVendorMappings = async () => {

    const transaction = await sequelize.transaction();

    try {

        // --------------------------------
        // 1. Find MobiKwik vendor
        // --------------------------------

        const mobikwikVendor =
            await AvailableAPIs.findOne({
                where: {
                    name: "MOBIKWIK",
                },
                transaction,
            });


        if (!mobikwikVendor) {
            throw new Error(
                "MOBIKWIK vendor not found in AvailableAPIs table"
            );
        }


        console.log(
            "MOBIKWIK vendorId:",
            mobikwikVendor.id
        );


        // --------------------------------
        // 2. Verify all circles exist
        // --------------------------------

        const circleIds =
            circleMappings.map(
                (item) => item.circleId
            );


        const circles =
            await CircleData.findAll({
                where: {
                    id: circleIds,
                },
                transaction,
            });


        if (
            circles.length !==
            circleMappings.length
        ) {
            const foundIds =
                circles.map(
                    (circle) => circle.id
                );

            const missingIds =
                circleIds.filter(
                    (id) =>
                        !foundIds.includes(id)
                );

            throw new Error(
                `Missing CircleData records: ${missingIds.join(", ")}`
            );
        }


        // --------------------------------
        // 3. Prepare mapping records
        // --------------------------------

        const mappings =
            circleMappings.map(
                ({
                    circleId,
                    circleCode,
                }) => ({
                    id: randomUUID(),

                    circleId,

                    vendorId:
                        mobikwikVendor.id,

                    circleCode,

                    status: "active",
                })
            );


        // --------------------------------
        // 4. Insert mappings
        // --------------------------------

        await CircleVendorMapping.bulkCreate(
            mappings,
            {
                transaction,

                updateOnDuplicate: [
                    "circleCode",
                    "status",
                    "updatedAt",
                ],
            }
        );


        await transaction.commit();


        console.log(
            `${mappings.length} MobiKwik CircleVendorMappings inserted/updated successfully.`
        );

    } catch (error) {

        await transaction.rollback();

        console.error(
            "CircleVendorMapping insertion failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {

        await sequelize.close();
    }
};


insertCircleVendorMappings();