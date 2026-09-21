const { DataTypes } = require("sequelize");
const sequelize = require("../../../util/db_connect");

const User = sequelize.define(
  "User",
  {
    // Unique User ID
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    // User mobile number
    mobileNo: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    // User name
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // User email
    // Email mandatory hai, lekin unique nahi hai
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    // User ka apna referral code
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // Kis user ne is user ko refer kiya
    // Isme referrer ki User.id store hogi
    referredBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    // User account status
    status: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "blocked",
        "suspended",
        "deleted"
      ),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "Users",
    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ["mobileNo"],
        name: "uq_user_mobile_no",
      },
      {
        unique: true,
        fields: ["referralCode"],
        name: "uq_user_referral_code",
      },
      {
        fields: ["referredBy"],
        name: "idx_user_referred_by",
      },
      {
        fields: ["status"],
        name: "idx_user_status",
      },
    ],
  }
);

// Self-referencing relationship
// User -> jisne refer kiya
User.belongsTo(User, {
  foreignKey: "referredBy",
  as: "referrer",
});

// User -> jin users ko is user ne refer kiya
User.hasMany(User, {
  foreignKey: "referredBy",
  as: "referredUsers",
});

module.exports = User;