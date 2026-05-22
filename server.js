const express = require('express')
const syncDB = require('./util/syncModel')
const dotenv = require('dotenv');
const http = require('http');
const setupSocketIO = require('./controller/Socket/SocketId');
dotenv.config()


// Models extraction starts here
const User = require("./models/UserModels/UserSchema/user")
const Api = require('./models/APIModels/api')
const SubCategory = require('./models/SubCategoryModel/subCategory')
const PaymentTransaction = require("./models/PaymentTransactionModel/paymentTransaction")
const rechargAndBillPaymentTransactions = require("./models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions")
// const rechargAndBillPaymentTransactionsTest = require("./models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransationDummy")
const RefundTransaction = require('./models/RefundTransactionModel/refundTransaction')
const WalletTransaction = require('./models/WalletModels/Wallet Transaction/walletTransaction')
const Category = require('./models/CategoryModel/category')
const Order = require('./models/OrderModel/order')
const WalletOrder = require('./models/OrderModel/walletOrder')
const Payment=require('./models/PaymentModel/payment')
const PaymentGateway=require('./models/PayentGatway/paymentGatway') 
const OperatorFields=require("./models/OperatorDataModel/operatorFields")
// Models extraction ends here
const bodyParser = require('body-parser')
const userRoutes = require('./routes/userRoutes/userRouter')
const otpRoute = require('./routes/OtpRoutes/otpRoute')
const walletRoute = require('./routes/walletRoutes/walletRouter')
const walletTransactionRoute = require('./routes/walletRoutes/walletTransactionRouter')
const mobileRechargeTransactionRoute = require('./routes/MobileRechargeTransactionRoutes/mobileRechargeTransactionRouter')
const mobileRechargeApiRoute = require('./routes/MobileRechargeRouter/mobileRecharge')
const ticketRoute = require('./routes/TicketRoutes/ticketRouter')
const adminTicketRoute = require('./routes/TicketRoutes/adminTicketRouter')
const chatRoute = require('./routes/ChatRouter/chatRoute')
const paymentRoute = require('./routes/PaymentRoutes/payment')
const vegaahPymentRoute = require('./routes/PaymentRoutes/vegaahPyment')
const allTransactionsRoute = require('./routes/AllTransactionsRoute/allTransactionsRouter')
const subCategoryRoute = require('./routes/SubCategoryRouter/subCategoryRoute')
const operatorRoute = require('./routes/OperatorRoutes/operatorRoute')
const adminOperatorRoute = require('./routes/OperatorRoutes/adminOperatorRoute')
const testingRoute = require('./routes/TestRoutes/testRoute')
const rchargeAndBillPaymentsRoute = require('./routes/RechargeAndBillPaymentsRouter/rechargeAndBillPayments')
const maintenanceRoute=require("./routes/MaintenanceRoute/maintenance")
const bannereRoute=require("./routes/BannerRoute/banner")
const appUsageRoutes=require("./routes/AppUsageRoute/versionCheck")   
const callbackRoute=require("./routes/CallbackRoute/rechargeCallbackRoute") 
const guideVideoRoute=require("./routes/GuidVideoRoute/guidVideo") 
const mobikwikRoute=require("./routes/MobikwikRouter/MobikwikRouter")
const provideerStatusCheck = require('./routes/ProviderStatusCheck/providerStatusCheck')
const refundbyAdmin = require('./routes/RefundbyAdmin/refundbyAdmin')
const userManagement = require('./routes/UserManagementRoute/userRouter')
const adminAnalytic = require('./routes/AdminAnalyticsRoute/AdminAnalyticsRoute')
const notification = require('./routes/NotificationRoute/notification')
const addTowallet = require('./routes/AddtoWalletRoutes/addToWallet')
const { initializeSocket } = require('./util/socket');    
  

 


// foreign key association starts here
// -----------------------------------------
// relationship between user and payment transaction table
// User.hasMany(PaymentTransaction)
// PaymentTransaction.belongsTo(User)


// relationship between user and rechargAndBillPaymentTransactions table
// User.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(User)


// relationship between Api table and rechargAndBillPaymentTransactions table
// Api.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(Api)


// relationship between SubCategory table and rechargAndBillPaymentTransactions table
// SubCategory.hasMany(rechargAndBillPaymentTransactions)
// rechargAndBillPaymentTransactions.belongsTo(SubCategory)

// WalletTransaction.hasMany(RefundTransaction, { foreignKey: 'walletTransactionId' })
// RefundTransaction.belongsTo(WalletTransaction, { foreignKey: 'walletTransactionId' })

// rechargAndBillPaymentTransactions.hasMany(RefundTransaction, { foreignKey: 'allTransactionId' })
// RefundTransaction.belongsTo(rechargAndBillPaymentTransactions, { foreignKey: 'allTransactionId' })


// Category.hasMany(SubCategory, { foreignKey: 'categoryId' })
// SubCategory.belongsTo(Category, { foreignKey: 'categoryId' })
// -------------------------------------------
// foreign key association ends here
syncDB()
const startServer = async () => {
const cors = require('cors')

const app = express()


app.use(bodyParser.json({ extended: false }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true);



// All routes
app.use('/user', userRoutes,addTowallet)
app.use('/user/wallet', walletRoute)
app.use('/user/wallet-transaction', walletTransactionRoute)
app.use('/user/mobile-recharge-transaction', mobileRechargeTransactionRoute)
app.use('/user/recharge', mobileRechargeApiRoute)
app.use('/user/ticket', ticketRoute)
app.use('/chat', chatRoute)
app.use('/user/payment', paymentRoute)
app.use('/user/test/payment', vegaahPymentRoute)
app.use('/user/vegaah/payment', vegaahPymentRoute)
app.use('/user/alltransactions', allTransactionsRoute)
app.use('/user/services', subCategoryRoute)
app.use('/user', operatorRoute)
app.use('/user', testingRoute)
app.use('/user', rchargeAndBillPaymentsRoute) 
app.use('/user/maintenance',maintenanceRoute)
app.use('/user/banner',bannereRoute)
app.use('/user/',guideVideoRoute)
app.use('/user/',notification)
app.use('/api/v1',mobikwikRoute)


app.use('/app',appUsageRoutes)
app.use('/callback',callbackRoute)
app.use('/',provideerStatusCheck) 


app.use('/admin/ticket', adminTicketRoute)
app.use('/admin',[userManagement,adminAnalytic,refundbyAdmin,adminOperatorRoute])

// app.use('/admin',adminAnalytic)


app.get('/', (req, res) => {
    res.send("Connected successfully")
})

app.use("/", otpRoute)




// process.on('uncaughtException', (err) => {
//     console.error('💥 Uncaught Exception:', err);
//   });
  
//   process.on('unhandledRejection', (reason, promise) => {
//     console.error('💥 Unhandled Rejection:', reason);
//   });
  



//---------------- server listen --------
let onlineTickets = new Set([])

 const server=http.createServer(app)
// server.listen(process.env.PORT, () => {
    
//     console.log(`Server listening at ${process.env.PORT}`);
//      console.log(`🚀🚀🚀[Worker ${process.pid}] Server listening on port ${process.env.PORT}`);
// });
 
 
// Initialize Socket.IO
await initializeSocket(server).then(() => {
  console.log("✅⭐⭐⭐⭐ Socket and Redis initialized.");
});

// -----------------------------------  API fot Get Online Tickets ------------------------

// app.get('/chat/online-status', (req, res) => {
//     try {

//         const onlineTicketsArray = Array.from(onlineTickets);

//         return res.status(200).json({ success: true, allTickets: onlineTicketsArray, statuscode: 1 })
//     } catch (error) {
//         return res.status(200).json({ success: false, message: "Internal server error" })
//     }
// });

}
module.exports = startServer;
