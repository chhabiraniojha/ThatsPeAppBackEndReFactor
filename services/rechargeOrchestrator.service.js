const {
  createRechargeTransaction,
  updateRechargeTransactionStatus
} = require('./rechargeTransaction.service');

const {
  debitWalletForRecharge,
  refundWallet
} = require('./walletTransaction.service');

const operatorModel = require('../models/OperatorDataModel/operatorData');
const circleModel = require('../models/CircleDataModel/circleData');

const roboticsRechargeService = require('./recharge/roboticRecharge');
const rechargeExchangeService = require('./recharge/rechargeExchangeRecharge');
const a1RechargeService = require('./recharge/a1Recharge');

async function processRecharge({
  userId,
  walletId,
  customerNo,
  amount,
  discountedAmount,
  subCategoryId,

  // SOURCE CODES
  ezytmOperatorCode,
  ezytmCircleCode,

  paymentTransactionType, // 'cash' | 'wallet'
  cashPaymentTransactionId = null,
  walletPaymentTransactionId = null,
}) {
  /* --------------------------------------------------
     STEP 0: FETCH OPERATOR & CIRCLE
  -------------------------------------------------- */
  const operatorData = await operatorModel.findOne({
    where: { ezytm_operator_code: ezytmOperatorCode }
  });

  if (!operatorData) {
    throw new Error('INVALID_OPERATOR');
  }

  const circleData = ezytmCircleCode
    ? await circleModel.findOne({
        where: { ezytm_circle_code: ezytmCircleCode }
      })
    : null;

  /* --------------------------------------------------
     STEP 1: CREATE / FETCH RECHARGE TRANSACTION
     (IDEMPOTENT)
  -------------------------------------------------- */
  const rechargeTransaction = await createRechargeTransaction({
    userId,
    customerNo,
    amount,
    discountedAmount,
    operator: operatorData.name,
    circle: circleData?.name || null,
    paymentTransactionType,
    cashPaymentTransactionId,
    walletPaymentTransactionId,
    subCategoryId,
    ezytmOperatorCode,
    ezytmCircleCode
  });

  /* --------------------------------------------------
     FINAL STATE SHORT-CIRCUIT
     (Do NOT re-run vendors)
  -------------------------------------------------- */
  if (
    ['PROCESSING', 'PENDING', 'SUCCESS', 'FAILED'].includes(
      rechargeTransaction.status
    )
  ) {
    return {
      status: rechargeTransaction.status,
      rechargeTransactionId: rechargeTransaction.id
    };
  }

  /* --------------------------------------------------
     STEP 2: WALLET DEBIT (ONLY ONCE)
  -------------------------------------------------- */
  if (paymentTransactionType === 'wallet') {
    await debitWalletForRecharge({
      walletId,
      amount: discountedAmount,
      rechargeTransactionId: rechargeTransaction.id,
      rechargeTypeId: subCategoryId,
      paymentTransactionId: walletPaymentTransactionId
    });
  }

  /* --------------------------------------------------
     STEP 3: MARK PROCESSING
  -------------------------------------------------- */
  await updateRechargeTransactionStatus({
    rechargeTransactionId: rechargeTransaction.id,
    status: 'PROCESSING'
  });

  /* --------------------------------------------------
     STEP 4: VENDOR MAP (EASYTM → VENDOR)
  -------------------------------------------------- */
  const vendorMap = [
    {
      name: 'roboticsExchange',
      call: roboticsRechargeService.roboticRecharge,
      operatorCode: operatorData.robotic_exchange_operator_code,
      circleCode: circleData?.robotic_exchange_circle_code
    },
    {
      name: 'rechargeExchange',
      call: rechargeExchangeService.rechargeExchange,
      operatorCode: operatorData.recharge_exchange_operator_code,
      circleCode: circleData?.recharge_exchange_circle_code
    },
    {
      name: 'a1',
      call: a1RechargeService.a1Recharge,
      operatorCode: operatorData.a1_operator_code,
      circleCode: circleData?.a1_circle_code
    }
  ];

  /* --------------------------------------------------
     STEP 5: TRY VENDORS SEQUENTIALLY
     (STOP ON SUCCESS OR PENDING)
  -------------------------------------------------- */
  let lastVendorName = null;

  for (const vendor of vendorMap) {
    if (!vendor.operatorCode || typeof vendor.call !== 'function') continue;

    lastVendorName = vendor.name;

    const result = await vendor.call({
      customer_number: customerNo,
      amount,
      operatorCode: vendor.operatorCode,
      circleCode: vendor.circleCode,
      rechargeTransactionId: rechargeTransaction.id
    });

    if (result.status === 'SUCCESS') {
      await updateRechargeTransactionStatus({
        rechargeTransactionId: rechargeTransaction.id,
        status: 'SUCCESS',
        apiName: vendor.name
      });

      return {
        status: 'SUCCESS',
        provider: vendor.name,
        rechargeTransactionId: rechargeTransaction.id
      };
    }

    if (result.status === 'PENDING') {
      await updateRechargeTransactionStatus({
        rechargeTransactionId: rechargeTransaction.id,
        status: 'PENDING',
        apiName: vendor.name
      });

      return {
        status: 'PENDING',
        provider: vendor.name,
        rechargeTransactionId: rechargeTransaction.id
      };
    }
    // FAILED → try next vendor
  }

  /* --------------------------------------------------
     STEP 6: FINAL FAILURE → REFUND
  -------------------------------------------------- */
  await updateRechargeTransactionStatus({
    rechargeTransactionId: rechargeTransaction.id,
    status: 'FAILED',
    apiName: lastVendorName
  });

  // refund process starts here
    await refundWallet({rechargeTransactionId: rechargeTransaction.id});


  return {
    status: 'FAILED',
    rechargeTransactionId: rechargeTransaction.id
  };
}
async function processRechargeForWallet({
  userId,
  customerNo,
  amount,
  discountedAmount,
  subCategoryId,

  // SOURCE CODES
  ezytmOperatorCode,
  ezytmCircleCode,
  paymentTransactionType, // 'cash' | 'wallet'
}) {
  /* --------------------------------------------------
     STEP 0: FETCH OPERATOR & CIRCLE
  -------------------------------------------------- */
  const operatorData = await operatorModel.findOne({
    where: { ezytm_operator_code: ezytmOperatorCode }
  });

  if (!operatorData) {
    throw new Error('INVALID_OPERATOR');
  }

  const circleData = ezytmCircleCode
    ? await circleModel.findOne({
        where: { ezytm_circle_code: ezytmCircleCode }
      })
    : null;

  /* --------------------------------------------------
     STEP 1: CREATE / FETCH RECHARGE TRANSACTION
     (IDEMPOTENT)
  -------------------------------------------------- */

  
  /* --------------------------------------------------
     STEP 2: WALLET DEBIT (ONLY ONCE)      
  -------------------------------------------------- */


  

    const walletPaymentTransaction = await debitWalletForRecharge({
      userId,
      amount: discountedAmount,
      rechargeTypeId: subCategoryId,
    });

    console.log("debitWalletForRecharge called--------",walletPaymentTransaction);
  
  const rechargeTransaction = await createRechargeTransaction({
    userId,
    customerNo,
    amount,
    discountedAmount,
    operator: operatorData.name,
    circle: circleData?.name || null,
    paymentTransactionType,
    cashPaymentTransactionId: null,
    walletPaymentTransactionId: walletPaymentTransaction.id,
    subCategoryId,
    ezytmOperatorCode,
    ezytmCircleCode
  });

  /* --------------------------------------------------
     FINAL STATE SHORT-CIRCUIT
     (Do NOT re-run vendors)
  -------------------------------------------------- */
  if (
    ['PROCESSING', 'PENDING', 'SUCCESS', 'FAILED'].includes(
      rechargeTransaction.status
    )
  ) {
    return {
      status: rechargeTransaction.status,
      rechargeTransactionId: rechargeTransaction.id
    };
  }


  /* --------------------------------------------------
     STEP 3: MARK PROCESSING
  -------------------------------------------------- */
  await updateRechargeTransactionStatus({
    rechargeTransactionId: rechargeTransaction.id,
    status: 'PROCESSING'
  });

  /* --------------------------------------------------
     STEP 4: VENDOR MAP (EASYTM → VENDOR)
  -------------------------------------------------- */
  const vendorMap = [
    {
      name: 'roboticsExchange',
      call: roboticsRechargeService.roboticRecharge,
      operatorCode: operatorData.robotic_exchange_operator_code,
      circleCode: circleData?.robotic_exchange_circle_code
    },
    {
      name: 'rechargeExchange',
      call: rechargeExchangeService.rechargeExchange,
      operatorCode: operatorData.recharge_exchange_operator_code,
      circleCode: circleData?.recharge_exchange_circle_code
    },
    {
      name: 'a1',
      call: a1RechargeService.a1Recharge,
      operatorCode: operatorData.a1_operator_code,
      circleCode: circleData?.a1_circle_code
    }
  ];

  /* --------------------------------------------------
     STEP 5: TRY VENDORS SEQUENTIALLY
     (STOP ON SUCCESS OR PENDING)
  -------------------------------------------------- */
  let lastVendorName = null;

  for (const vendor of vendorMap) {
    if (!vendor.operatorCode || typeof vendor.call !== 'function') continue;

    lastVendorName = vendor.name;

    const result = await vendor.call({
      customer_number: customerNo,
      amount,
      operatorCode: vendor.operatorCode,
      circleCode: vendor.circleCode,
      rechargeTransactionId: rechargeTransaction.id
    });

    if (result.status === 'SUCCESS') {
      await updateRechargeTransactionStatus({
        rechargeTransactionId: rechargeTransaction.id,
        status: 'SUCCESS',
        apiName: vendor.name
      });

      return {
        status: 'SUCCESS',
        provider: vendor.name,
        rechargeTransactionId: rechargeTransaction.id
      };
    }

    if (result.status === 'PENDING') {
      await updateRechargeTransactionStatus({
        rechargeTransactionId: rechargeTransaction.id,
        status: 'PENDING',
        apiName: vendor.name
      });

      return {
        status: 'PENDING',
        provider: vendor.name,
        rechargeTransactionId: rechargeTransaction.id
      };
    }
    // FAILED → try next vendor
  }

  /* --------------------------------------------------
     STEP 6: FINAL FAILURE → REFUND
  -------------------------------------------------- */
  await updateRechargeTransactionStatus({
    rechargeTransactionId: rechargeTransaction.id,
    status: 'FAILED',
    apiName: lastVendorName
  });

  // refund process starts here
    await refundWallet({rechargeTransactionId: rechargeTransaction.id});


  return {
    status: 'FAILED',
    rechargeTransactionId: rechargeTransaction.id
  };
}

module.exports = {
  processRecharge,
  processRechargeForWallet
};
