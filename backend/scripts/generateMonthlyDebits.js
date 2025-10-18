const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const Package = require('../models/Package');

// Helper function to convert billing cycle string to days
const getBillingCycleInDays = (billingCycleString) => {
  switch (billingCycleString) {
    case 'quarterly':
      return 90;
    case 'annually':
      return 365;
    case 'monthly':
    default:
      return 30;
  }
};

// Connect to the database
connectDB();

const generateMonthlyDebits = async () => {
  console.log('Starting monthly debit generation process...');

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    const users = await MikrotikUser.find({ tenantOwner: tenantId }).populate('package');
    const today = new Date();

    for (const user of users) {
      if (!user.package || !user.package.price || user.package.price <= 0) {
        console.log(`Skipping user ${user.username} (ID: ${user._id}) - No package with a valid price assigned.`);
        continue;
      }

      // Find the last debit transaction for this user
      const lastDebit = await WalletTransaction.findOne({
        mikrotikUser: user._id,
        type: 'Debit',
        source: 'Monthly Bill',
      }).sort({ createdAt: -1 });

      let shouldGenerateDebit = false;
      if (!lastDebit) {
        // If there's no debit history, generate the first one.
        shouldGenerateDebit = true;
        console.log(`No previous debit found for ${user.username}. Generating first debit.`);
      } else {
        const lastDebitDate = new Date(lastDebit.createdAt);
        const daysSinceLastDebit = (today.getTime() - lastDebitDate.getTime()) / (1000 * 3600 * 24);
        
        const billingCycleDays = getBillingCycleInDays(user.billingCycle);

        if (daysSinceLastDebit >= billingCycleDays) {
          shouldGenerateDebit = true;
          console.log(`User ${user.username} is due for billing. Last bill was ${daysSinceLastDebit.toFixed(1)} days ago.`);
        } else {
          console.log(`Skipping user ${user.username}. Last bill was ${daysSinceLastDebit.toFixed(1)} days ago. Next bill in approx. ${(billingCycleDays - daysSinceLastDebit).toFixed(1)} days.`);
        }
      }

      if (shouldGenerateDebit) {
        const debitAmount = user.package.price;
        const newBalance = user.walletBalance - debitAmount;

        // Create the debit transaction
        await WalletTransaction.create({
          mikrotikUser: user._id,
          tenantOwner: user.tenantOwner, // Associate with the tenant
          transactionId: `DEBIT-${Date.now()}-${user.username}`,
          type: 'Debit',
          amount: debitAmount,
          source: 'Monthly Bill',
          balanceAfter: newBalance,
          comment: `Monthly subscription charge for ${user.package.name}.`,
        });

        // Update the user's wallet balance
        user.walletBalance = newBalance;
        await user.save();

        console.log(`Successfully generated debit of KES ${debitAmount} for ${user.username}. New balance: KES ${newBalance}.`);
      }
    }

    console.log('Monthly debit generation process completed.');
  } catch (error) {
    console.error('An error occurred during the debit generation process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
generateMonthlyDebits();
