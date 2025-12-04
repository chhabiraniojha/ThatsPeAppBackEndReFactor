// const express = require('express')
// const syncDB = require('./util/syncModel')
// const dotenv = require('dotenv');
// const http = require('http');
// const setupSocketIO = require('./controller/Socket/SocketId');
// dotenv.config()


// // Models extraction starts here
// const User = require("./models/UserModels/UserSchema/user")
// const Api = require('./models/APIModels/api')
// const SubCategory = require('./models/SubCategoryModel/subCategory')
// const PaymentTransaction = require("./models/PaymentTransactionModel/paymentTransaction")
// const rechargAndBillPaymentTransactions = require("./models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions")
// // const rechargAndBillPaymentTransactionsTest = require("./models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransationDummy")
// const RefundTransaction = require('./models/RefundTransactionModel/refundTransaction')
// const WalletTransaction = require('./models/WalletModels/Wallet Transaction/walletTransaction')
// const Category = require('./models/CategoryModel/category')
// // Models extraction ends here
// const bodyParser = require('body-parser')
// const userRoutes = require('./routes/userRoutes/userRouter')
// const otpRoute = require('./routes/OtpRoutes/otpRoute')
// const walletRoute = require('./routes/walletRoutes/walletRouter')
// const walletTransactionRoute = require('./routes/walletRoutes/walletTransactionRouter')
// const mobileRechargeTransactionRoute = require('./routes/MobileRechargeTransactionRoutes/mobileRechargeTransactionRouter')
// const mobileRechargeApiRoute = require('./routes/MobileRechargeRouter/mobileRecharge')
// const ticketRoute = require('./routes/TicketRoutes/ticketRouter')
// const adminTicketRoute = require('./routes/TicketRoutes/adminTicketRouter')
// const chatRoute = require('./routes/ChatRouter/chatRoute')
// const paymentRoute = require('./routes/PaymentRoutes/payment')
// const allTransactionsRoute = require('./routes/AllTransactionsRoute/allTransactionsRouter')
// const subCategoryRoute = require('./routes/SubCategoryRouter/subCategoryRoute')
// const operatorRoute = require('./routes/OperatorRoutes/operatorRoute')
// const testingRoute = require('./routes/TestRoutes/testRoute')
// const rchargeAndBillPaymentsRoute = require('./routes/RechargeAndBillPaymentsRouter/rechargeAndBillPayments')
// const maintenanceRoute=require("./routes/MaintenanceRoute/maintenance")
// const bannereRoute=require("./routes/BannerRoute/banner")
// const appUsageRoutes=require("./routes/AppUsageRoute/versionCheck")   
// const callbackRoute=require("./routes/CallbackRoute/rechargeCallbackRoute") 
// const guideVideoRoute=require("./routes/GuidVideoRoute/guidVideo") 
// const { initializeSocket } = require('./util/socket');      


// const cors = require('cors')

// const app = express()


// app.use(bodyParser.json({ extended: false }));
// app.use(cors());
// app.set('trust proxy', true);



// // All routes
// app.use('/user', userRoutes)
// app.use('/user/wallet', walletRoute)
// app.use('/user/wallet-transaction', walletTransactionRoute)
// app.use('/user/mobile-recharge-transaction', mobileRechargeTransactionRoute)
// app.use('/user/recharge', mobileRechargeApiRoute)
// app.use('/user/ticket', ticketRoute)
// app.use('/admin/ticket', adminTicketRoute)
// app.use('/chat', chatRoute)
// app.use('/user/payment', paymentRoute)
// app.use('/user/alltransactions', allTransactionsRoute)
// app.use('/user/services', subCategoryRoute)
// app.use('/user', operatorRoute)
// app.use('/user', testingRoute)
// app.use('/user', rchargeAndBillPaymentsRoute) 
// app.use('/user/maintenance',maintenanceRoute)
// app.use('/user/banner',bannereRoute)
// app.use('/user/',guideVideoRoute)


// app.use('/app',appUsageRoutes)
// app.use('/callback',callbackRoute)


// app.get('/', (req, res) => {
//     res.send("Connected successfully")
// })

// app.use("/", otpRoute)

// // foreign key association starts here
// // -----------------------------------------
// // relationship between user and payment transaction table
// User.hasMany(PaymentTransaction)
// PaymentTransaction.belongsTo(User)


// // relationship between user and rechargAndBillPaymentTransactions table
// User.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(User)


// // relationship between Api table and rechargAndBillPaymentTransactions table
// Api.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(Api)


// // relationship between SubCategory table and rechargAndBillPaymentTransactions table
// SubCategory.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(SubCategory)

// WalletTransaction.hasMany(RefundTransaction, { foreignKey: 'walletTransactionId' })
// RefundTransaction.belongsTo(WalletTransaction, { foreignKey: 'walletTransactionId' })

// rechargAndBillPaymentTransactions.hasMany(RefundTransaction, { foreignKey: 'allTransactionId' })
// RefundTransaction.belongsTo(rechargAndBillPaymentTransactions, { foreignKey: 'allTransactionId' })


// Category.hasMany(SubCategory, { foreignKey: 'categoryId' })
// SubCategory.belongsTo(Category, { foreignKey: 'categoryId' })
// // -------------------------------------------
// // foreign key association ends here



// // process.on('uncaughtException', (err) => {
// //     console.error('💥 Uncaught Exception:', err);
// //   });

// //   process.on('unhandledRejection', (reason, promise) => {
// //     console.error('💥 Unhandled Rejection:', reason);
// //   });


// syncDB()

// //---------------- server listen --------
// let onlineTickets = new Set([])

// const server = app.listen(process.env.PORT, () => {

//     console.log(`Server listening at ${process.env.PORT}`);
// });
// // Setup Socket.IO
// // ---------------------- Socket Io Part Intigartion ------------------

// // setInterval(() => {
// //     const used = process.memoryUsage();
// //     console.log(`[Memory Check] RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
// //   }, 10000); // logs every 10 seconds


// // socket io  Intigartion 
// // const io = require('socket.io')(server, {
// //     cors: {
// //         origin: "*"
// //     },
// //     pingTimeout: 60000
// // })

// // io.on("connection", (socket) => {
// //     console.log("connected to socket.io 💥💥💥💥💥💥💥")



// //     // User/Executive joins a specific room based on the ticket ID
// //     socket.on("join-room", ({ ticketId, role }) => {
// //         socket.join(ticketId);
// //         socket.ticketId = ticketId;
// //         console.log(`Socket ${socket.id} joined room ${ socket.ticketId } role is ${role}`);


// //         // Emit an event to notify to admin that which ticket is now online that the user has joined 
// //         if (role == "user") {
// //             onlineTickets.add(ticketId)
// //             io.emit("user-joined", { ticketId });
// //             console.log(onlineTickets, "🚀🚀🚀🚀🚀🚀");

// //         }


// //     });



// //     // Handle executive messages
// //     socket.on("executive-message", (data) => {
// //         const { ticketId, message } = data;
// //         console.log(`Message from executive on ticket ${ticketId}: ${message}`);

// //         // Broadcast the message to the user in the same room
// //         io.to(ticketId).emit("receive-message", { sender: "executive", message });
// //     });

// //     // Handle user messages
// //     socket.on("user-message", (data) => {
// //         const { ticketId, message } = data;
// //         console.log(`Message from user on ticket ${ticketId}: ${message}`);

// //         // Broadcast the message to the executive in the same room
// //         io.to(ticketId).emit("receive-message", { sender: "user", message });
// //     }); 
// //        // Handle Real Time Ticket Creation 
// //     socket.on("ticket-create", (data) => {
// //         const { ticketId } = data;
// //         console.log("user creat a ticket and the ticket id is ------>",ticketId);       
// //         io.emit("user-ticket-create",{ticketId}) 
// //     });


// //     socket.on("disconnect", () => {     

// //         console.log("Socket disconnected");
// //         const ticketId = socket.ticketId;


// //         if (ticketId) {
// //             onlineTickets.delete(ticketId);
// //             io.emit("update-ticket-status", { ticketId });
// //             console.log(`user disconect hit ho gaya 🙏🏽🙏🏽🙏🏽🙏🏽🙏🏽🙏🏽 ${ticketId}`);
// //         }


// //     })


// // })

// // Initialize Socket.IO
// initializeSocket(server);

// // -----------------------------------  API fot Get Online Tickets ------------------------

// app.get('/chat/online-status', (req, res) => {
//     try {

//         const onlineTicketsArray = Array.from(onlineTickets);

//         return res.status(200).json({ success: true, allTickets: onlineTicketsArray, statuscode: 1 })
//     } catch (error) {
//         return res.status(200).json({ success: false, message: "Internal server error" })
//     }
// });


// const startServer = require('./server');
// index.js
const cluster = require('cluster');
const os = require('os');
const startServer = require('./server');
const { setupMaster } = require('@socket.io/sticky');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    // console.log(`[Master] PID ${process.pid} is running. Starting ${numCPUs} workers...`);

    // ✅ Sticky session master setup — point to server.js
   const http = require('http');
    const httpServer = http.createServer(); // ✅ Needed for sticky sessions

    setupMaster(httpServer, {
        loadBalancingMethod: 'least-connection',
    });

    httpServer.listen(process.env.PORT, () => {
    
    console.log(`Server listening at ${process.env.PORT}`);
    //  console.log(`🚀🚀🚀[Worker ${process.pid}] Server listening on port ${process.env.PORT}`);
});
    //fork  part 
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
        // console.log("❌❌❌❌❌❌❌❌ ")
    }

    cluster.on('exit', (worker) => {
        // console.log(`❌ Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    startServer();
}

// startServer()