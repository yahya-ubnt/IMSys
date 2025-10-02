const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const Package = require('../models/Package');

// Connect to the database
connectDB();

const generateMonthlyDebits = async () => {
  console.log('Starting monthly debit generation process...');

  try {
    const users = await MikrotikUser.find({}).populate('package');
    const today = new Date();

    for (const user of users) {
      if (!user.package) {
        console.log(`Skipping user ${user.username} (ID: ${user._id}) - No package assigned.`);
        continue;
      }

      // Find the last debit transaction for this user
      const lastDebit = await WalletTransaction.findOne({
        userId: user._id,
        type: 'Debit',
        source: 'Monthly Bill',
      }).sort({ createdAt: -1 });

      let shouldGenerateDebit = false;
      if (!lastDebit) {
        // If there's no debit history, generate the first one.
        shouldGenerateDebit = true;
        console.log(`No previous debit found for ${user.username}. Generating first debit.`);
      } else {
        // Check if the last debit was more than the billing cycle ago
        const lastDebitDate = new Date(lastDebit.createdAt);
        const daysSinceLastDebit = (today.getTime() - lastDebitDate.getTime()) / (1000 * 3600 * 24);
        
        // Use user's billing cycle, default to 30 days
        const billingCycleDays = user.billingCycle || 30; 

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
          userId: user._id,
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
