const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const Coupon = require("./Coupon");
const Order = require("../OrderModel/order");

const UserCoupon = sequelize.define(
  "UserCoupon",
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

    couponId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Coupon,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    // Why this coupon was given to the user
    sourceType: {
      type: DataTypes.ENUM(
        "REFERRAL",
        "PROMOTION",
        "CAMPAIGN",
        "MANUAL"
      ),
      allowNull: false,
    },

    // Reference ID of the source
    // Example: Referral ID / Campaign ID
    sourceReferenceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "UNUSED",
        "USED",
        "EXPIRED"
      ),
      allowNull: false,
      defaultValue: "UNUSED",
    },

    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    orderId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: Order,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "UserCoupons",
    timestamps: true,

    indexes: [
      {
        fields: ["userId"],
        name: "idx_user_coupon_user_id",
      },
      {
        fields: ["couponId"],
        name: "idx_user_coupon_coupon_id",
      },
      {
        fields: ["sourceType"],
        name: "idx_user_coupon_source_type",
      },
      {
        fields: ["sourceReferenceId"],
        name: "idx_user_coupon_source_reference_id",
      },
      {
        fields: ["status"],
        name: "idx_user_coupon_status",
      },
      {
        fields: ["orderId"],
        name: "idx_user_coupon_order_id",
      },
      {
        fields: ["createdAt"],
        name: "idx_user_coupon_created_at",
      },
    ],
  }
);

/* User */

User.hasMany(UserCoupon, {
  foreignKey: "userId",
  as: "coupons",
});

UserCoupon.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/* Coupon */

Coupon.hasMany(UserCoupon, {
  foreignKey: "couponId",
  as: "userCoupons",
});

UserCoupon.belongsTo(Coupon, {
  foreignKey: "couponId",
  as: "coupon",
});

/* Order */

Order.hasMany(UserCoupon, {
  foreignKey: "orderId",
  as: "usedCoupons",
});

UserCoupon.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

module.exports = UserCoupon;