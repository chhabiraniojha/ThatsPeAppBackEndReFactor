const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const Order = require("../OrderModel/order");
const User = require("../UserModels/UserSchema/user");
const PaymentGateway = require("../PayentGatway/paymentGatway");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    orderId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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

    gatewayId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: PaymentGateway,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    paymentMode: {
      type: DataTypes.ENUM(
        "UPI",
        "DEBIT_CARD",
        "CREDIT_CARD",
        "NET_BANKING"
      ),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    gatewayTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    gatewayOrderId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    rrn: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    signature: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "INITIATED",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "INITIATED",
    },

    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    responseCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    rawCallback: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "Payments",
    timestamps: true,

    indexes: [
      {
        fields: ["orderId"],
        name: "idx_payment_order_id",
      },
      {
        fields: ["userId"],
        name: "idx_payment_user_id",
      },
      {
        fields: ["gatewayId"],
        name: "idx_payment_gateway_id",
      },
      {
        fields: ["paymentMode"],
        name: "idx_payment_mode",
      },
      {
        fields: ["status"],
        name: "idx_payment_status",
      },
      {
        unique: true,
        fields: ["gatewayId", "gatewayTransactionId"],
        name: "uq_payment_gateway_transaction",
      },
      {
        unique: true,
        fields: ["gatewayId", "gatewayOrderId"],
        name: "uq_payment_gateway_order",
      },
    ],
  }
);

/* Associations */

Order.hasOne(Payment, {
  foreignKey: "orderId",
  as: "payment",
});

Payment.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

User.hasMany(Payment, {
  foreignKey: "userId",
  as: "payments",
});

Payment.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

PaymentGateway.hasMany(Payment, {
  foreignKey: "gatewayId",
  as: "payments",
});

Payment.belongsTo(PaymentGateway, {
  foreignKey: "gatewayId",
  as: "gateway",
});

module.exports = Payment;