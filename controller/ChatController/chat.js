const util = require('util');
const fs = require('fs');
const chatModel = require('../../models/ChatModel/chat');
const ticketModel = require('../../models/TicketModel/ticket')
const user = require('../../models/UserModels/UserSchema/user');
const multer = require('multer')
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const uidgenerate = require('../../util/uidGenerator');





const readFileAsync = util.promisify(fs.readFile);

// Configure Multer for file uploads
const upload = multer().single('myFile')

exports.messages = async (req, res, next) => {
    const { message, messageType = "text", ticketId, userId = "", adminId = "" } = req.body;
    try {
        const ticket = await ticketModel.findOne({ where: { id: ticketId }  })
        if (ticket == null) {
            res.status(200).json({ message: "No such tickets found", success: false, statuscode: 0 })
        } else {
            const id = await uidgenerate()
            const chats = await chatModel.create({ id, message, messageType, ticketId, userId, adminId })
            res.status(200).json({ message: "Message sent", success: true, statuscode: 1, chats })
        }
    } catch (error) {

        return res.status(500).json({ message: "Internal Srever Error", success: false, error })
    }
}

const uploadToS3 = (data, fileName) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET_KEY = process.env.IAM_USER_SECRET_KEY;

    const s3 = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET_KEY,
    });
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: data
    };
    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });


}

exports.mediaMessages = async (req, res, next) => {
    upload(req, res, async (err) => {
        const { ticketId, userId = "", adminId = "" } = req.body
        if (err) {
            return res.status(200).json({ message: "Some error occurred", success: false, statuscode: 0, err })
        }
        try {
            const uploadedFile = req.file
            const fileName = uploadedFile.originalname
            const messageType = uploadedFile.mimetype
            const fileContentBuffer = uploadedFile.buffer

            const fileUrl = await uploadToS3(fileContentBuffer, fileName)
            const message = fileUrl.Location
            const id = await uidgenerate()

            const chats = await chatModel.create({ id, message, messageType, ticketId, userId, adminId })
            return res.status(200).json({ message: 'File uploaded successfully', success: true, statuscode: 1, chats });
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", success: false, error });
        }
    })
}


exports.getMessages = async (req, res, next) => {
    const { ticketId } = req.query
    try {
        const ticket = await ticketModel.findOne({ where: { id: ticketId } })
        if (ticket == null) {
            return res.status(200).json({ message: "Invalid Ticket Id", success: false, statuscode: 0 })
        } else {
            const chats = await chatModel.findAll({
                where: {
                    ticketId: ticketId
                },
                order: [['createdAt', 'ASC']]
            })
            return res.status(201).json({ message: "Chats fetched successfully", success: true, statuscode: 1, chats })
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
}