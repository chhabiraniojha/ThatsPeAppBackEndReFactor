const express = require('express');
const syncDB = require('./util/syncModel');
const dotenv = require('dotenv');
const Sentry = require('@sentry/node');
const http = require('http');
const setupSocketIO = require('./controller/Socket/SocketId');
const logger = require('./util/logger');

dotenv.config();

// Models extraction starts here
const User = require("./models/UserModels/UserSchema/user");
const Api = require('./models/APIModels/api');
const SubCategory = require('./models/SubCategoryModel/subCategory');
const rechargAndBillPaymentTransactions = require('./models/RechargeAndBillPaymentTransactionsModels/rechargeAndBillPaymentTransactions');
const WalletTransaction = require('./models/WalletModels/Wallet Transaction/walletTransaction');
const Category = require('./models/CategoryModel/category');
const Order = require('./models/OrderModel/order');
const Payment = require('./models/PaymentModel/payment');
const PaymentGateway = require('./models/PayentGatway/paymentGatway');
const OperatorVendorMapping = require("./models/OperatorDataModel/OperatorVendorMapping");
const OperatorVendorSeqMapping = require("./models/OperatorDataModel/OperatorVendorSeqMap");
const CircleVendorMapping = require("./models/CircleDataModel/CircleVendorMapping");
const VendorAttempt = require("./models/VendorAttemptModels/vendorAttempts");
const WalletWithdrawal = require("./models/WalletModels/WalletawithdrawlModel");
const ReferralConfig = require("./models/ReferralModel/ReferralConfig");
const Referral = require("./models/ReferralModel/Referral");
const Coupon = require("./models/CouponModels/Coupon");
const UserCoupons = require("./models/CouponModels/UserCoupons");
const MobiKwikOperator=require("./models/MobikwikModel/MobikwikOperator");
const MobiKwikCCBPBankList=require("./models/MobikwikModel/MobikwikCCBPBankLIst");
const MobiKwikDistrictDiscom=require("./models/MobikwikModel/MobiKwikDistrictDiscom");
const MobiKwikHPCLDistributorList=require("./models/MobikwikModel/MobiKwikHPCLDistributorList");
const MobiKwikShriramGeneralInsuranceQuotePay=require("./models/MobikwikModel/MobiKwikShriramGeneralInsuranceQuotePay");
const MobiKwikMadhyaPradeshUrban=require("./models/MobikwikModel/MobiKwikMadhyaPradeshUrban");
const MobiKwikOdishaMunicipalPayments=require("./models/MobikwikModel/MobiKwikOdishaMunicipalPayments");
const MobiKwikJharkhandSubdivisionCodeList=require("./models/MobikwikModel/MobiKwikJharkhandSubdivisionCodeList");
const ConvenienceFee=require("./models/ConvenienceFeeModel/ConvenienceFee")
// Models extraction ends here

const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes/userRouter');
const otpRoute = require('./routes/OtpRoutes/otpRoute');
const walletRoute = require('./routes/walletRoutes/walletRouter');
const walletTransactionRoute = require('./routes/walletRoutes/walletTransactionRouter');
const mobileRechargeTransactionRoute = require('./routes/MobileRechargeTransactionRoutes/mobileRechargeTransactionRouter');
const mobileRechargeApiRoute = require('./routes/MobileRechargeRouter/mobileRecharge');
const ticketRoute = require('./routes/TicketRoutes/ticketRouter');
const adminTicketRoute = require('./routes/TicketRoutes/adminTicketRouter');
const chatRoute = require('./routes/ChatRouter/chatRoute');
const paymentRoute = require('./routes/PaymentRoutes/payment');
const vegaahPymentRoute = require('./routes/PaymentRoutes/vegaahPyment');
const allTransactionsRoute = require('./routes/AllTransactionsRoute/allTransactionsRouter');
const subCategoryRoute = require('./routes/SubCategoryRouter/subCategoryRoute');
const operatorRoute = require('./routes/OperatorRoutes/operatorRoute');
const adminOperatorRoute = require('./routes/OperatorRoutes/adminOperatorRoute');
const testingRoute = require('./routes/TestRoutes/testRoute');
const rchargeAndBillPaymentsRoute = require('./routes/RechargeAndBillPaymentsRouter/rechargeAndBillPayments');
const maintenanceRoute = require("./routes/MaintenanceRoute/maintenance");
const bannereRoute = require("./routes/BannerRoute/banner");
const appUsageRoutes = require("./routes/AppUsageRoute/versionCheck");
const callbackRoute = require("./routes/CallbackRoute/rechargeCallbackRoute");
const guideVideoRoute = require("./routes/GuidVideoRoute/guidVideo");
const mobikwikRoute = require("./routes/MobikwikRouter/MobikwikRouter");
const provideerStatusCheck = require('./routes/ProviderStatusCheck/providerStatusCheck');
const refundbyAdmin = require('./routes/RefundbyAdmin/refundbyAdmin');
const userManagement = require('./routes/UserManagementRoute/userRouter');
const adminAnalytic = require('./routes/AdminAnalyticsRoute/AdminAnalyticsRoute');
const notification = require('./routes/NotificationRoute/notification');
const addTowallet = require('./routes/AddtoWalletRoutes/addToWallet');
const razorpayRoute = require('./routes/PaymentRoutes/razorpay');
const zaakpayRoute = require('./routes/PaymentRoutes/zaakpay');
const { initializeSocket } = require('./util/socket');
const orderRoute=require('./routes/OrderRoute/order')


// -----------------------------------------
// Server Start
// -----------------------------------------

const startServer = async () => {

  await syncDB();

  const cors = require('cors');

  const app = express();

  app.use(bodyParser.json({ extended: false }));
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('trust proxy', true);


  // -----------------------------------------
  // All routes
  // -----------------------------------------
  app.use((req, res, next) => {
    console.log(
      `[WORKER ${process.pid}] ${req.method} ${req.originalUrl}`
    );

    next();
  });
  app.use('/user', userRoutes, addTowallet);
  app.use('/user/wallet', walletRoute);
  app.use('/user/wallet-transaction', walletTransactionRoute);
  app.use('/user/mobile-recharge-transaction', mobileRechargeTransactionRoute);
  app.use('/user/recharge', mobileRechargeApiRoute);
  app.use('/user/ticket', ticketRoute);
  app.use('/chat', chatRoute);
  app.use('/user/payment', paymentRoute);
  app.use('/user/test/payment', vegaahPymentRoute);
  app.use('/user/vegaah/payment', vegaahPymentRoute);
  app.use('/user/razorpay', razorpayRoute);
  app.use('/user/zaakpay', zaakpayRoute);
  app.use('/user/alltransactions', allTransactionsRoute);
  app.use('/user/services', subCategoryRoute);
  app.use('/user', operatorRoute);
  app.use('/user', testingRoute);
  app.use('/user', rchargeAndBillPaymentsRoute);
  app.use('/user/maintenance', maintenanceRoute);
  app.use('/user/banner', bannereRoute);
  app.use('/user/', guideVideoRoute);
  app.use('/user/', notification);
  app.use("/user/", otpRoute);
  app.use('/mobikwik', mobikwikRoute);
  app.use('/user/order', orderRoute);

  app.use('/app', appUsageRoutes);
  app.use('/callback', callbackRoute);
  app.use('/', provideerStatusCheck);

  app.use('/admin/ticket', adminTicketRoute);
  app.use('/admin', [
    userManagement,
    adminAnalytic,
    refundbyAdmin,
    adminOperatorRoute
  ]);

  app.get('/', (req, res) => {
    res.send("Connected successfully");
  });




  // -----------------------------------------
  // Sentry Error Handler
  // IMPORTANT: This must be AFTER all routes
  // -----------------------------------------

  Sentry.setupExpressErrorHandler(app);


  // -----------------------------------------
  // HTTP Server
  // -----------------------------------------

  let onlineTickets = new Set([]);

  const server = http.createServer(app);


  // -----------------------------------------
  // Initialize Socket.IO
  // -----------------------------------------

  await initializeSocket(server).then(() => {
    console.log("✅⭐⭐⭐⭐ Socket and Redis initialized.");
  });

};


module.exports = startServer;