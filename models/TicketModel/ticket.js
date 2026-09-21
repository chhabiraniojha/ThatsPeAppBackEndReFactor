const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const Order = require("../OrderModel/order");

const Ticket = sequelize.define(
  "Ticket",
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

    executiveId: {
      type: DataTypes.STRING(50),
      allowNull: false,
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

    ticketDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    resolveMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("open", "close"),
      allowNull: false,
      defaultValue: "open",
    },

    resolveStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    interveneStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    requestingStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    ticketSubCategory: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "Tickets",
    timestamps: true,

    indexes: [
      {
        fields: ["userId"],
        name: "idx_ticket_user_id",
      },
      {
        fields: ["orderId"],
        name: "idx_ticket_order_id",
      },
      {
        fields: ["executiveId"],
        name: "idx_ticket_executive_id",
      },
      {
        fields: ["status"],
        name: "idx_ticket_status",
      },
      {
        fields: ["ticketSubCategory"],
        name: "idx_ticket_subcategory",
      },
      {
        fields: ["createdAt"],
        name: "idx_ticket_created_at",
      },
    ],
  }
);

// User → Tickets
User.hasMany(Ticket, {
  foreignKey: "userId",
  as: "tickets",
});

Ticket.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Order → Tickets
Order.hasMany(Ticket, {
  foreignKey: "orderId",
  as: "tickets",
});

Ticket.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

module.exports = Ticket;