const crypto = require("crypto");

const sequelize = require("../util/db_connect");

const Category = require("../models/CategoryModel/category");
const SubCategory = require("../models/SubCategoryModel/subCategory");

const subCategories = [
  // =========================
  // Recharge
  // =========================
  {
    categoryName: "Recharge",
    name: "Prepaid",
    displayOrder: 1,
  },
  {
    categoryName: "Recharge",
    name: "Mobile Postpaid",
    displayOrder: 2,
  },
  {
    categoryName: "Recharge",
    name: "DTH",
    displayOrder: 3,
  },
  {
    categoryName: "Recharge",
    name: "Fastag",
    displayOrder: 4,
  },
  {
    categoryName: "Recharge",
    name: "Voucher",
    displayOrder: 5,
  },

  // =========================
  // Utilities
  // =========================
  {
    categoryName: "Utilities",
    name: "Broadband Postpaid",
    displayOrder: 1,
  },
  {
    categoryName: "Utilities",
    name: "Electricity",
    displayOrder: 2,
  },
  {
    categoryName: "Utilities",
    name: "Gas",
    displayOrder: 3,
  },
  {
    categoryName: "Utilities",
    name: "Prepaid Meter",
    displayOrder: 4,
  },
  {
    categoryName: "Utilities",
    name: "Landline Postpaid",
    displayOrder: 5,
  },
  {
    categoryName: "Utilities",
    name: "Cable TV",
    displayOrder: 6,
  },
  {
    categoryName: "Utilities",
    name: "Water",
    displayOrder: 7,
  },
  {
    categoryName: "Utilities",
    name: "Municipal Services",
    displayOrder: 8,
  },

  // =========================
  // Financial Services & Taxes
  // =========================
  {
    categoryName: "Financial Services & Taxes",
    name: "Loan Repayment",
    displayOrder: 1,
  },
  {
    categoryName: "Financial Services & Taxes",
    name: "Municipal Taxes",
    displayOrder: 2,
  },
  {
    categoryName: "Financial Services & Taxes",
    name: "Insurance",
    displayOrder: 3,
  },
  {
    categoryName: "Financial Services & Taxes",
    name: "Subscription",
    displayOrder: 4,
  },
  {
    categoryName: "Financial Services & Taxes",
    name: "Donation",
    displayOrder: 5,
  },
  {
    categoryName: "Financial Services & Taxes",
    name: "Credit Card",
    displayOrder: 6,
  },

  // =========================
  // Other Services
  // =========================
  {
    categoryName: "Other Services",
    name: "Agent Collection",
    displayOrder: 1,
  },
];

async function insertSubCategories() {
  const transaction = await sequelize.transaction();

  try {
    for (const subCategoryData of subCategories) {
      // Find parent category
      const category = await Category.findOne({
        where: {
          categoryName: subCategoryData.categoryName,
        },
        transaction,
      });

      if (!category) {
        throw new Error(
          `Category not found: ${subCategoryData.categoryName}`
        );
      }

      // Check existing subcategory under same category
      const existingSubCategory = await SubCategory.findOne({
        where: {
          categoryId: category.id,
          name: subCategoryData.name,
        },
        transaction,
      });

      if (existingSubCategory) {
        console.log(
          `Already exists: ${subCategoryData.categoryName} -> ${subCategoryData.name}`
        );
        continue;
      }

      await SubCategory.create(
        {
          id: crypto.randomUUID(),

          categoryId: category.id,

          name: subCategoryData.name,

          icon: null,

          status: "active",

          popular: false,

          displayOrder: subCategoryData.displayOrder,

          createdBy: null,

          updatedBy: null,
        },
        {
          transaction,
        }
      );

      console.log(
        `Inserted: ${subCategoryData.categoryName} -> ${subCategoryData.name}`
      );
    }

    await transaction.commit();

    console.log("\nSubCategory insertion SUCCESS");
    console.log(`Total configured: ${subCategories.length}`);
  } catch (error) {
    await transaction.rollback();

    console.error("\nSubCategory insertion FAILED");
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

insertSubCategories();