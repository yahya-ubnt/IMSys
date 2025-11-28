const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Subscription = require('../models/Subscription');
const WalletTransaction = require('../models/WalletTransaction');
const MikrotikUser = require('../models/MikrotikUser');

// Helper function to get the start of the current billing cycle
const getBillingCycleStartDate = (billingCycle) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (billingCycle) {
    case 'Quarterly':
      // This is a simplified example. A real implementation would be more complex.
      const quarter = Math.floor(today.getMonth() / 3);
      return new Date(today.getFullYear(), quarter * 3, 1);
    case 'Annually':
      return new Date(today.getFullYear(), 0, 1);
    case 'Monthly':
    default:
      return new Date(today.getFullYear(), today.getMonth(), 1);
  }
};

// Connect to the database
connectDB();

const generateBillsFromSubscriptions = async () => {
  console.log('Starting subscription-based bill generation process...');

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    const cursor = Subscription.find({
      tenant: tenantId,
      status: 'Active',
    }).populate('mikrotikUser').cursor();

    console.log('Processing active subscriptions for this tenant...');

    await cursor.eachAsync(async (sub) => {
      try {
        if (!sub.mikrotikUser) {
          console.log(`Skipping subscription ${sub._id} - No associated Mikrotik user found.`);
          return;
        }

        const cycleStartDate = getBillingCycleStartDate(sub.billingCycle);

        // Check if a bill has already been generated for this cycle
        const existingDebit = await WalletTransaction.findOne({
          mikrotikUser: sub.mikrotikUser._id,
          type: 'Debit',
          source: 'Monthly Bill',
          createdAt: { $gte: cycleStartDate },
        });

        if (existingDebit) {
          console.log(`Skipping user ${sub.mikrotikUser.username}. A bill has already been generated for this cycle.`);
          return;
        }

        console.log(`Generating bill for ${sub.mikrotikUser.username}...`);

        const debitAmount = sub.amount;
        const user = await MikrotikUser.findById(sub.mikrotikUser._id);
        const newBalance = user.walletBalance - debitAmount;

        // Create the debit transaction
        await WalletTransaction.create({
          mikrotikUser: user._id,
          tenant: user.tenant,
          transactionId: `DEBIT-${Date.now()}-${user.username}`,
          type: 'Debit',
          amount: debitAmount,
          source: 'Monthly Bill',
          balanceAfter: newBalance,
          comment: `Subscription charge for ${sub.name}.`,
        });

        // Update the user's wallet balance
        user.walletBalance = newBalance;
        await user.save();

        console.log(`Successfully generated debit of KES ${debitAmount} for ${user.username}. New balance: KES ${newBalance}.`);
      } catch (userError) {
        console.error(`Failed to process bill for user ${sub.mikrotikUser?.username || sub._id}. Error:`, userError);
        // This error is logged, and the loop will continue with the next user.
      }
    });

    console.log('Subscription-based bill generation process completed.');
  } catch (error) {
    console.error('A critical error occurred during the bill generation process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
generateBillsFromSubscriptions();
