module.exports = {
  MIKROTIK_USER_CREATED: {
    name: 'mikrotik_user_created',
    description: 'Triggered when a new Mikrotik user is created.',
    variables: [
      'officialName',
      'username',
      'mPesaRefNo',
      'mobileNumber',
      'expiryDate',
      'walletBalance',
      'billAmount',
      'installationFee',
      'totalAmount',
    ],
  },
  PAYMENT_RECEIVED: {
    name: 'payment_received',
    description: 'Triggered when a payment is successfully received.',
    variables: [
      'officialName',
      'username',
      'mPesaRefNo',
      'amountPaid',
      'newWalletBalance',
      'paymentDate',
    ],
  },
};
