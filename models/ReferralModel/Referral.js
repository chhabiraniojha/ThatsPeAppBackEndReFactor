const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");

const Referral = sequelize.define(
  "Referral",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    referrerUserId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    referredUserId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    rewardAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    couponDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    minimumRechargeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    rewardStatus: {
      type: DataTypes.ENUM(
        "PENDING",
        "SUCCESS",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    rewardWalletTransactionId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    rewardedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "Referrals",
    timestamps: true,

    indexes: [
      {
        fields: ["referrerUserId"],
        name: "idx_referral_referrer_user_id",
      },
      {
        unique: true,
        fields: ["referredUserId"],
        name: "uq_referral_referred_user_id",
      },
      {
        fields: ["rewardStatus"],
        name: "idx_referral_reward_status",
      },
      {
        fields: ["createdAt"],
        name: "idx_referral_created_at",
      },
    ],
  }
);

/* Referrer User */

User.hasMany(Referral, {
  foreignKey: "referrerUserId",
  as: "sentReferrals",
});

Referral.belongsTo(User, {
  foreignKey: "referrerUserId",
  as: "referrer",
});

/* Referred User */

User.hasOne(Referral, {
  foreignKey: "referredUserId",
  as: "referral",
});

Referral.belongsTo(User, {
  foreignKey: "referredUserId",
  as: "referredUser",
});

module.exports = Referral;