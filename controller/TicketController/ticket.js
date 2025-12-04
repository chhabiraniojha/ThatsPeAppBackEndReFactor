const ticketModel = require('../../models/TicketModel/ticket');
const transactionModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');

// ---------------- chacge the transation model for testing porpose ------------
// const transactionModel = require('../../models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransationDummy')

const chatModel = require('../../models/ChatModel/chat');
const idgenerator = require('../../util/uidGenerator');
const jwt = require('jsonwebtoken');
const sequelize = require('../../util/db_connect');
const { Op } = require('sequelize');
const userModel = require('../../models/UserModels/UserSchema/user');
let { sendEmail } = require('../../util/nodeMailerConfig');
const { default: axios } = require('axios');
const Logger = require('../../util/logData');

// -----------Create A New Ticket----------------
exports.createTicket = async (req, res) => {
  const { email } = req.user;
  const userId = req.user.id;
  const { transactionId, ticketDescription } = req.body;
  let t;

  try {
    // Check if the transaction exists
    const transactionDetails = await transactionModel.findOne({ where: { id: transactionId } });
    if (transactionDetails == null) {
      return res.status(200).json({ message: 'No transactions found', success: false, statuscode: 0 });
    }

    // Check if there's already an open ticket for this transaction
    const checkTicketExistance = await ticketModel.findOne({ where: { transactionId: transactionId, status: 'open' } });
    if (checkTicketExistance) {
      return res
        .status(200)
        .json({ message: 'One ticket already exist for this transaction with open status', success: false, statuscode: 0 });
    }
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

    // Find the executive to assign the ticket to
    // const executive= await sequelize.query(`
    //     SELECT *
    //     FROM Admins
    //     WHERE ActiveTickets < MaxTickets AND AdminRole = 'worker_admin'
    //     ORDER BY ActiveTickets ASC

    // `, {
    //     type: sequelize.QueryTypes.SELECT,
    //     transaction: t
    // });

    const executive = await axios.get(`${process.env.MYPAY_ADMIN_BACKEND_URL}admin/executive`);

    if (!executive.data.success) {
      return res.status(200).json({ message: 'No executives available at this time tray after some time', success: false, statuscode: 0 });
    }
    console.log(executive.data.executive, 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx');

    const ticketSubCategory = transactionDetails.dataValues.SubCategoryId;
    let adminId = executive.data.executive[0].AdminId;

    const id = await idgenerator();
    let message = `Your ticket is ${id}`;

    console.log(id, userId, transactionId, ticketDescription, ticketSubCategory, adminId, 'XXxxxxxxxXXXXXXXXXXxXxxxxx');

    t = await sequelize.transaction();

    const generateTicket = await ticketModel.create(
      { id, userId, transactionId, ticketDescription, ticketSubCategory, executiveId: adminId },
      { transaction: t }
    );

    // try {
    //     const generateTicket = await ticketModel.create(
    //         { id, userId, transactionId, ticketDescription, ticketSubCategory, executiveId: executive.AdminId },
    //         { transaction: t }
    //     );
    //     console.log('Ticket created successfully:', generateTicket);
    // } catch (error) {
    //     console.error('Error creating ticket:', error);
    // }

    const chatId = await idgenerator();
    // const chats = await chatModel.create(
    //     { id: chatId, message: ticketDescription, messageType: "text", ticketId: id, userId, executiveId: executive.AdminId },
    // { transaction: t }
    // )

    // Update the executive's active ticket count
    await sequelize.query(
      `
            UPDATE Admins
            SET ActiveTickets = ActiveTickets + 1, AllTickets = AllTickets + 1
            WHERE AdminId = :adminId
        `,
      {
        replacements: { adminId: adminId },
        transaction: t
      }
    );

    // let updateAdminTicket= await axios.put('http://localhost:3000/admin/update-executive-ticket', {

    //     adminId: adminId

    // })
    // console.log(updateAdminTicket);

    await t.commit();

    try {
      await sendEmail({
        success: true,
        email: email,
        subject: 'Ticket Generated Successfully',
        message
      });
    } catch (emailError) {
      console.error('Failed to send email', emailError);
      // Log the error, but don't rollback the transaction
    }
    return res.status(200).json({ message: 'Ticket generated successfully', success: true, statuscode: 1, generateTicket });
  } catch (error) {
    Logger.error({
      error_message: error ? error.name : 'error form ticket creat ',
      user: email,
      url: '/user/ticket/create-ticket',
      http_method: 'post',
      status_code: '0'
    });

    console.log(error);
    // await t.rollback()
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};

// --------------Get Ticket for specific User----------------
exports.getAllTicket = async (req, res) => {
  const user = req.user;
  try {
    const userId = user.id;
    const ticketDetails = await ticketModel.findAll({
      where: {
        userId: userId
      },
      order: [['createdAt', 'DESC']]
    });
    if (ticketDetails.length > 0) {
      return res.status(200).json({ message: 'Fetched tickets successfully!', success: true, statuscode: 1, ticketDetails });
    } else {
      return res.status(200).json({ message: 'No tickets found', success: false, statuscode: 0 });
    }
  } catch (error) {
    Logger.error({
      error_message: error ? error.name : 'error form get all ticket ',
      user: user ? user.id : 'token not find',
      url: '/user/ticket',
      http_method: 'get',
      status_code: '0'
    });
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};
// --------------Get Ticket For Specific Admin ----------------
exports.getAllTicketForAdmin = async (req, res) => {
  const admin = req.admin;
  try {
    const executiveId = admin.AdminId;
    const ticketDetails = await ticketModel.findAll({
      where: {
        executiveId: executiveId
      },
      order: [['createdAt', 'DESC']]
    });
    if (ticketDetails.length > 0) {
      return res.status(200).json({ message: 'Fetched tickets successfully!', success: true, statuscode: 1, ticketDetails });
    } else {
      return res.status(200).json({ message: 'No tickets found', success: false, statuscode: 0 });
    }
  } catch (error) {
    Logger.error({
      error_message: error ? error.name : 'error form get all ticket ',
      user: admin ? admin.AdminId : 'token not find',
      url: '/user/ticket',
      http_method: 'get',
      status_code: '0'
    });
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};
exports.getAllOpenTickets = async (req, res) => {
  const admin = req.admin;
  try {
    if (admin.AdminRole != 'super_admin') {
      return res.status(200).json({ message: 'You do not have permission to access all tickets.', success: false, statuscode: 0 });
    }
    const ticketDetails = await ticketModel.findAll({
      where: {
        status: 'open'
      },
      order: [['createdAt', 'DESC']]
    });
    if (ticketDetails.length > 0) {
      return res.status(200).json({ message: 'Fetched tickets successfully!', success: true, statuscode: 1, ticketDetails });
    } else {
      return res.status(200).json({ message: 'No tickets found', success: false, statuscode: 0 });
    }
  } catch (error) {
    Logger.error({
      error_message: error ? error.name : 'error form get all ticket ',
      user: admin ? admin.AdminId : 'token not find',
      url: '/user/ticket',
      http_method: 'get',
      status_code: '0'
    });
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};

// --------------Get All Ticket by email or Ticketid ----------------
exports.getAllTicketByEmailOrTicketId = async (req, res) => {
  const { email = '', ticketId = '' } = req.body;

  try {
    let userId = '';
    if (email != '') {
      const user = await userModel.findOne({ where: { email: email }, attributes: ['id'] });
      userId = user.id;
    }
    const ticketByUserId = await ticketModel.findAll({
      where: {
        [Op.or]: [{ userId: userId }, { id: ticketId }]
      },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ message: 'Fetched records successfully', success: true, statuscode: 1, ticketByUserId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'internal Srever Error', success: false });
  }
};

// update ticket
exports.closeTicketByUser = async (req, res) => {
  const { ticketId } = req.body;

  try {
    const ticket = await ticketModel.findOne({ where: { id: ticketId } });
    if (ticket == null) {
      return res.status(200).json({ message: 'No such tickets found', success: false, statuscode: 0 });
    } else {
      try {
        const updateTicket = await ticket.update({ status: 'close', resolveStatus: true });
        return res.status(200).json({ message: 'Ticket updated successfully', success: true, statuscode: 1, updateTicket });
      } catch (error) {
        return res.status(200).json({ message: 'Some error occurred', success: false, statuscode: 0, error });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error, success: false });
  }
};

exports.closeTicketByAdmin = async (req, res) => {
  const token = req.header('authorization');
  const admin = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const { ticketId, resolveMessage } = req.body;

  try {
    const adminId = admin.adminId;
    console.log(admin, 'adminIdxxxxxxxxxx');
    const query = `SELECT * FROM Admins WHERE AdminId='${adminId}'`;
    const [adminDetails, metadata] = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });
    console.log(adminDetails, 'adminDetailsxxxxxxxxxx');
    const adminRole = adminDetails.AdminRole;
    if (adminRole == 'worker_admin' || adminRole == 'admin' || adminRole == 'super_admin') {
      const ticket = await ticketModel.findOne({ where: { id: ticketId } });
      if (ticket == null) {
        return res.status(200).json({ message: 'No such tickets found', success: false, statuscode: 0 });
      } else {
        try {
          const updateTicket = await ticket.update({ status: 'close', resolveStatus: true, resolveMessage });
          return res.status(200).json({ message: 'Ticket updated successfully', success: true, statuscode: 1, updateTicket });
        } catch (error) {
          return res.status(200).json({ message: 'Some error occurred', success: false, statuscode: 0, error });
        }
      }
    } else {
      return res.status(200).json({ message: 'Failed to update', success: false, statuscode: 0 });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error', error, success: false });
  }
};

exports.changeTicketInterveneStatus = async (req, res) => {
  let admin = req.admin;
  // console.log(admin);
  const { ticketId } = req.body;

  try {
    const ticket = await ticketModel.findOne({ where: { id: ticketId } });
    if (ticket == null) {
      return res.status(200).json({ message: 'No such tickets found', success: false, statuscode: 0 });
    }
    if (ticket.executiveId == admin.AdminId) {
      const updateTicket = await ticket.update({ interveneStatus: true });
    } else {
      return res.status(200).json({ message: 'You Are Not Authorised Person For Intervene ', success: false, statuscode: 0 });
    }
    return res.status(200).json({ message: 'Ticket Intervene successfully', success: true, statuscode: 1 });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};
exports.changeTicketResolveStatus = async (req, res) => {
  let admin = req.admin;
  // console.log(admin);
  const { ticketId } = req.body;

  try {
    const ticket = await ticketModel.findOne({ where: { id: ticketId } });
    if (ticket == null) {
      return res.status(200).json({ message: 'No such tickets found', success: false, statuscode: 0 });
    }
    if (ticket.executiveId == admin.AdminId) {
      const updateTicket = await ticket.update({ interveneStatus: false, resolveStatus: true });
    } else {
      return res.status(200).json({ message: 'You Are Not Authorised Person For Intervene ', success: false, statuscode: 0 });
    }
    return res.status(200).json({ message: 'Ticket Resove successfully', success: true, statuscode: 1 });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', success: false, error });
  }
};

// delete ticket
