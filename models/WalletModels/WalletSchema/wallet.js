const { DataTypes } = require("sequelize");
const sequelize = require("../../../util/db_connect");

const User = require("../../UserModels/UserSchema/user");

const Wallet = sequelize.define(
  "Wallet",
  {
    // System generated wallet ID
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // One user can have only one wallet
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

    // Current wallet balance
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    // Wallet status
    status: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "blocked",
        "suspended"
      ),
      allowNull: false,
      defaultValue: "active",
    },

    // Audit information
    createdBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "Wallets",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["userId"],
        name: "uq_wallet_user_id",
      },
      {
        fields: ["status"],
        name: "idx_wallet_status",
      },
    ],
  }
);

// User -> Wallet
User.hasOne(Wallet, {
  foreignKey: "userId",
  as: "wallet",
});

Wallet.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = Wallet;