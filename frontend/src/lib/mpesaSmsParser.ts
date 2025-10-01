export interface ParsedMpesaDetails {
  transactionId?: string;
  amount?: number;
  date?: string; // YYYY-MM-DD format
  time?: string; // HH:MM AM/PM format
  receiverEntity?: string;
  phoneNumber?: string;
  transactionCost?: number;
  transactionMessage?: string; // The full SMS message
  type?: string; // e.g., "sent", "paid", "received"
}

export function parseMpesaSms(sms: string): ParsedMpesaDetails {
  const details: ParsedMpesaDetails = { transactionMessage: sms };

  // Regex patterns for common M-Pesa SMS formats
  // M-PESA Confirmed. [Transaction ID] Confirmed. on [Date] at [Time]
  // You paid Ksh[Amount] to [Recipient Name] for account [Account Number] on [Date] at [Time]. New M-Pesa balance is Ksh[Balance].
  // You sent Ksh[Amount] to [Recipient Name] [Recipient Number] on [Date] at [Time]. New M-Pesa balance is Ksh[Balance].
  // Received Ksh[Amount] from [Sender Name] [Sender Number] on [Date] at [Time]. New M-Pesa balance is Ksh[Balance].

  // Transaction ID
  const transactionIdMatch = sms.match(/([A-Z0-9]{10}) Confirmed/);
  if (transactionIdMatch) {
    details.transactionId = transactionIdMatch[1];
  }

  // Amount
  const amountMatch = sms.match(/Ksh([\d,]+\.\d{2})/);
  if (amountMatch) {
    details.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Date and Time
  const dateTimeMatch = sms.match(/on (\d{1,2}\/\d{1,2}\/\d{2}) at (\d{1,2}:\d{2} [AP]M)/);
  if (dateTimeMatch) {
    const [, datePart, timePart] = dateTimeMatch;
    // Convert date from DD/MM/YY to YYYY-MM-DD
    const [day, month, year] = datePart.split('/').map(Number);
    const fullYear = 2000 + year; // Assuming 21st century
    details.date = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    details.time = timePart;
  }

  // Recipient/Sender Name and Number (for sent/paid)
  const sentPaidMatch = sms.match(/(?:sent|paid) Ksh[\d,]+\.\d{2} (?:to|from) (.+?) (\d+) on/);
  if (sentPaidMatch) {
    details.receiverEntity = sentPaidMatch[1].trim();
    details.phoneNumber = sentPaidMatch[2];
    details.type = sentPaidMatch[0].startsWith('sent') ? 'sent' : 'paid';
  }

  // Recipient/Sender Name and Number (for received) - assuming similar format for received
  const receivedMatch = sms.match(/Received Ksh[\d,]+\.\d{2} from (.+?) (\d+) on/);
  if (receivedMatch) {
    details.receiverEntity = receivedMatch[1].trim();
    details.phoneNumber = receivedMatch[2];
    details.type = 'received';
  }

  // For Pay Bill / Buy Goods (account number) - keep existing as it's different
  const payBillBuyGoodsMatch = sms.match(/to ([^\n]+?) for account ([^\n]+?) on/);
  if (payBillBuyGoodsMatch) {
    details.receiverEntity = payBillBuyGoodsMatch[1].trim();
    details.phoneNumber = payBillBuyGoodsMatch[2].trim(); // Account number as contact info
    details.type = 'paid';
  }

  // Transaction Cost
  const costMatch = sms.match(/(?:charges of|Transaction cost,?) Ksh([\d,]+\.\d{2})/);
  if (costMatch) {
    details.transactionCost = parseFloat(costMatch[1].replace(/,/g, ''));
  }

  return details;
}
