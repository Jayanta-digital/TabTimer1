// Payments Module
async function initiatePremiumUpgrade(plan) {
  const prices = CONFIG.payment.plans;
  const payment = prices[plan];
  const transactionId = `TAB${Date.now()}`;
  
  const upiUrl = buildUPIUrl({
    pa: CONFIG.payment.upiId,
    pn: CONFIG.payment.merchantName,
    am: payment.amount,
    cu: CONFIG.payment.currency,
    tn: `Premium ${plan} subscription`,
    tr: transactionId
  });
  
  window.location.href = upiUrl;
  
  setTimeout(() => {
    showManualPaymentDialog({
      upiId: CONFIG.payment.upiId,
      amount: payment.amount,
      transactionId: transactionId,
      plan: plan
    });
  }, 3000);
}

function buildUPIUrl(params) {
  return `upi://pay?${new URLSearchParams(params).toString()}`;
}

function showManualPaymentDialog(paymentDetails) {
  toast.info('Payment dialog opened. Complete payment in UPI app.');
}

async function confirmPayment(transactionId, plan) {
  toast.info('Payment confirmation sent. Admin will verify within 24 hours.');
}
