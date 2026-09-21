const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const SubCategory = require("../SubCategoryModel/subCategory");
const OperatorData = require("../OperatorDataModel/operatorData");
const CircleData = require("../CircleDataModel/circleData");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    serviceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: SubCategory,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    serviceRef: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    operatorType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    operatorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: OperatorData,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    circleId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: CircleData,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    discountedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    paymentMethod: {
      type: DataTypes.ENUM("UPI", "WALLET", "COMBO"),
      allowNull: false,
    },

    walletAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    onlinePaidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    status: {
      type: DataTypes.ENUM(
        "CREATED",
        "PROCESSING",
        "PENDING",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "CREATED",
    },
  },
  {
    tableName: "Orders",
    timestamps: true,

    indexes: [
      {
        fields: ["userId"],
        name: "idx_order_user_id",
      },
      {
        fields: ["serviceType"],
        name: "idx_order_service_type",
      },
      {
        fields: ["operatorId"],
        name: "idx_order_operator_id",
      },
      {
        fields: ["circleId"],
        name: "idx_order_circle_id",
      },
      {
        fields: ["paymentMethod"],
        name: "idx_order_payment_method",
      },
      {
        fields: ["status"],
        name: "idx_order_status",
      },
      {
        fields: ["createdAt"],
        name: "idx_order_created_at",
      },
    ],
  }
);

/* Associations */

// User → Orders
User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
});

Order.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// SubCategory → Orders
SubCategory.hasMany(Order, {
  foreignKey: "serviceType",
  as: "orders",
});

Order.belongsTo(SubCategory, {
  foreignKey: "serviceType",
  as: "service",
});

// OperatorData → Orders
OperatorData.hasMany(Order, {
  foreignKey: "operatorId",
  as: "orders",
});

Order.belongsTo(OperatorData, {
  foreignKey: "operatorId",
  as: "operator",
});

// CircleData → Orders
CircleData.hasMany(Order, {
  foreignKey: "circleId",
  as: "orders",
});

Order.belongsTo(CircleData, {
  foreignKey: "circleId",
  as: "circle",
});

module.exports = Order;