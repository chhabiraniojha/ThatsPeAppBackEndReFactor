const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')
const Ticket = require('../../models/TicketModel/ticket')

const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    }, 
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ticketId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Ticket,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

Ticket.hasMany(Chat, { foreignKey: 'ticketId' });
Chat.belongsTo(Ticket, { foreignKey: 'ticketId' });

module.exports = Chat