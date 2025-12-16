// backend/scripts/encryptExistingCredentials.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ApplicationSettings = require('../models/ApplicationSettings');
const { encrypt } = require('../utils/crypto');

const migrateCredentials = async () => {
  await connectDB();

  try {
    const settingsList = await ApplicationSettings.find({});
    let updatedCount = 0;

    for (const settings of settingsList) {
      let needsSave = false;

      // Check if mpesaPaybill data exists and looks like it's not encrypted
      if (settings.mpesaPaybill && settings.mpesaPaybill.consumerKey && !settings.mpesaPaybill.consumerKey.includes(':')) {
        console.log(`Encrypting M-Pesa Paybill for tenant ${settings.tenant}...`);
        const paybillData = {
          environment: settings.mpesaPaybill.environment,
          paybillNumber: settings.mpesaPaybill.paybillNumber,
          consumerKey: settings.mpesaPaybill.consumerKey,
          consumerSecret: settings.mpesaPaybill.consumerSecret,
          passkey: settings.mpesaPaybill.passkey,
          activated: settings.mpesaPaybill.activated,
          callbackURL: settings.mpesaPaybill.callbackURL,
        };
        settings.mpesaPaybill = encrypt(JSON.stringify(paybillData));
        needsSave = true;
      }

      // Check if mpesaTill data exists and looks like it's not encrypted
      if (settings.mpesaTill && settings.mpesaTill.consumerKey && !settings.mpesaTill.consumerKey.includes(':')) {
        console.log(`Encrypting M-Pesa Till for tenant ${settings.tenant}...`);
        const tillData = {
            environment: settings.mpesaTill.environment,
            tillStoreNumber: settings.mpesaTill.tillStoreNumber,
            tillNumber: settings.mpesaTill.tillNumber,
            consumerKey: settings.mpesaTill.consumerKey,
            consumerSecret: settings.mpesaTill.consumerSecret,
            passkey: settings.mpesaTill.passkey,
            activated: settings.mpesaTill.activated,
        };
        settings.mpesaTill = encrypt(JSON.stringify(tillData));
        needsSave = true;
      }

      if (needsSave) {
        await settings.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. ${updatedCount} settings document(s) updated.`);
  } catch (error) {
    console.error('Error during credential migration:', error);
  } finally {
    mongoose.disconnect();
  }
};

migrateCredentials();
