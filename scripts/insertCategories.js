const crypto = require("crypto");

const sequelize = require("../util/db_connect");
const Category = require("../models/CategoryModel/category");

const categories = [
  {
    categoryName: "Recharge",
    displayOrder: 1,
  },
  {
    categoryName: "Utilities",
    displayOrder: 2,
  },
  {
    categoryName: "Financial Services & Taxes",
    displayOrder: 3,
  },
  {
    categoryName: "Other Services",
    displayOrder: 4,
  },
];

async function insertCategories() {
  const transaction = await sequelize.transaction();

  try {
    console.log("Starting Category insertion...");

    for (const category of categories) {
      const existingCategory = await Category.findOne({
        where: {
          categoryName: category.categoryName,
        },
        transaction,
      });

      if (existingCategory) {
        console.log(
          `Already exists: ${category.categoryName}`
        );
        continue;
      }

      await Category.create(
        {
          id: crypto.randomUUID(),
          categoryName: category.categoryName,
          displayOrder: category.displayOrder,
          status: "active",
          createdBy: null,
          updatedBy: null,
        },
        {
          transaction,
        }
      );

      console.log(`Inserted: ${category.categoryName}`);
    }

    await transaction.commit();

    console.log("=================================");
    console.log("Category insertion SUCCESS");
    console.log("=================================");
  } catch (error) {
    await transaction.rollback();

    console.error("=================================");
    console.error("Category insertion FAILED");
    console.error(error);
    console.error("=================================");

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

insertCategories();