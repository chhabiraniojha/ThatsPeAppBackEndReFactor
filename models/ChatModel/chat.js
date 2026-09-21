const { DataTypes } = require("sequelize");

const sequelize = require("../../util/db_connect");

const User = require("../UserModels/UserSchema/user");
const Ticket = require("../TicketModel/ticket");

const Chat = sequelize.define(
  "Chat",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    messageType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    ticketId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: Ticket,
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

    adminId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "Chats",
    timestamps: true,

    indexes: [
      {
        fields: ["ticketId"],
        name: "idx_chat_ticket_id",
      },
      {
        fields: ["userId"],
        name: "idx_chat_user_id",
      },
      {
        fields: ["adminId"],
        name: "idx_chat_admin_id",
      },
      {
        fields: ["createdAt"],
        name: "idx_chat_created_at",
      },
    ],
  }
);

// Ticket → Chats
Ticket.hasMany(Chat, {
  foreignKey: "ticketId",
  as: "chats",
});

Chat.belongsTo(Ticket, {
  foreignKey: "ticketId",
  as: "ticket",
});

// User → Chats
User.hasMany(Chat, {
  foreignKey: "userId",
  as: "chats",
});

Chat.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = Chat;