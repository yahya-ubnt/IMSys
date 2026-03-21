// This script migrates the old SMS Acknowledgement and Template structure to the new unified SmsTemplate model.
//
// ** IMPORTANT **
// 1. BACK UP YOUR DATABASE BEFORE RUNNING THIS SCRIPT.
// 2. This script only CREATES new templates. It DOES NOT DELETE any old data.
// 3. After running and verifying, you will need to manually drop the 'smsacknowledgements' collection.
//    You will also need to clean up the 'smstemplates' collection to remove the old named templates.

require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Define schemas for reading old data
const OldSmsAcknowledgementSchema = new mongoose.Schema({
  triggerType: String,
  status: String,
  tenant: mongoose.Schema.Types.ObjectId,
  smsTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'OldSmsTemplate' }
});
const OldSmsAcknowledgement = mongoose.model('OldSmsAcknowledgement', OldSmsAcknowledgementSchema, 'smsacknowledgements');

const OldSmsTemplateSchema = new mongoose.Schema({
  name: String,
  messageBody: String,
});
const OldSmsTemplate = mongoose.model('OldSmsTemplate', OldSmsTemplateSchema, 'smstemplates');


// This is the new, refactored model
const NewSmsTemplate = require('../models/SmsTemplate');

const migrateSmsTemplates = async () => {
  await connectDB();

  console.log('Starting SMS template migration...');

  try {
    const acks = await OldSmsAcknowledgement.find().populate('smsTemplate');

    if (acks.length === 0) {
      console.log('No SMS acknowledgements found to migrate.');
      return;
    }

    console.log(`Found ${acks.length} acknowledgements to migrate.`);

    for (const ack of acks) {
      if (!ack.smsTemplate) {
        console.warn(`Acknowledgement for trigger ${ack.triggerType} is missing a template link. Skipping.`);
        continue;
      }

      // Check if a new template for this trigger and tenant already exists
      const existingNewTemplate = await NewSmsTemplate.findOne({
        triggerType: ack.triggerType,
        tenant: ack.tenant,
      });

      if (existingNewTemplate) {
        console.log(`Template for trigger ${ack.triggerType} already exists for this tenant. Skipping.`);
        continue;
      }

      console.log(`Migrating template for trigger: ${ack.triggerType}`);

      await NewSmsTemplate.create({
        triggerType: ack.triggerType,
        messageBody: ack.smsTemplate.messageBody,
        status: ack.status,
        tenant: ack.tenant,
      });
    }

    console.log('Migration process completed.');
    console.log('** IMPORTANT **');
    console.log('New templates have been created based on your old acknowledgements.');
    console.log("Please review the new templates in your application's SMS Templates section.");
    console.log("After you have confirmed the migration is successful, you can manually drop the 'smsacknowledgements' collection from your database.");

  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    mongoose.connection.close();
  }
};

migrateSmsTemplates();
