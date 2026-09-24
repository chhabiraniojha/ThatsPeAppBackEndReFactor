const sequelize = require("../util/db_connect");
const CircleData = require("../models/CircleDataModel/circleData");

const circles = [
    {
        id: "1",
        name: "Andhra Pradesh",
    },
    {
        id: "2",
        name: "Assam",
    },
    {
        id: "3",
        name: "Bihar & Jharkhand",
    },
    {
        id: "4",
        name: "Chennai",
    },
    {
        id: "5",
        name: "Delhi & NCR",
    },
    {
        id: "6",
        name: "Gujarat",
    },
    {
        id: "7",
        name: "Haryana",
    },
    {
        id: "8",
        name: "Himachal Pradesh",
    },
    {
        id: "9",
        name: "Jammu & Kashmir",
    },
    {
        id: "10",
        name: "Karnataka",
    },
    {
        id: "11",
        name: "Kerala",
    },
    {
        id: "12",
        name: "Kolkata",
    },
    {
        id: "13",
        name: "Maharashtra & Goa (except Mumbai)",
    },
    {
        id: "14",
        name: "MP & Chattisgarh",
    },
    {
        id: "15",
        name: "Mumbai",
    },
    {
        id: "16",
        name: "North East",
    },
    {
        id: "17",
        name: "Orissa",
    },
    {
        id: "18",
        name: "Punjab",
    },
    {
        id: "19",
        name: "Rajasthan",
    },
    {
        id: "20",
        name: "Tamilnadu",
    },
    {
        id: "21",
        name: "UP(EAST)",
    },
    {
        id: "22",
        name: "UP(WEST) & Uttarakhand",
    },
    {
        id: "23",
        name: "West Bengal",
    },
];

const insertCircles = async () => {
    try {
        await CircleData.bulkCreate(circles, {
            updateOnDuplicate: [
                "name",
                "updatedAt",
            ],
        });

        console.log(
            `${circles.length} circles inserted/updated successfully.`
        );
    } catch (error) {
        console.error(
            "Circle insertion failed:",
            error
        );
    } finally {
        await sequelize.close();
    }
};

insertCircles();