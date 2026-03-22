const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const Tenant = require('../models/Tenant'); // Assuming you have a Tenant model

const createDefaultExpirySchedule = async () => {
  await connectDB();

  try {
    // IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' with the actual ID of the tenant
    // For example, if your tenant's name is 'MEDIATEK', you might find its ID in the database.
    // Or, if you know the ID from your seeder, use that.
    const tenantId = '69bd0e47a1eec99584642238'; 

    if (tenantId === 'YOUR_TENANT_ID_HERE') {
      console.error('ERROR: Please replace "YOUR_TENANT_ID_HERE" with the actual tenant ID.');
      process.exit(1);
    }

    // Check if the tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      console.error(`ERROR: Tenant with ID ${tenantId} not found.`);
      process.exit(1);
    }

    const defaultScheduleData = {
      name: 'Default Expiry Reminder (3 Days Before)',
      days: 3,
      timing: 'Before',
      messageBody: 'Hello {{officialName}}, your WiFi subscription expires on {{expiryDate}}. Your total due is KES {{totalAmount}}. Please renew to avoid disconnection. Call {{mobileNumber}} for assistance.',
      status: 'Active',
      tenant: tenantId,
    };

    const existingSchedule = await SmsExpirySchedule.findOne({ name: defaultScheduleData.name, tenant: tenantId });

    if (existingSchedule) {
      console.log(`SmsExpirySchedule "${defaultScheduleData.name}" already exists for tenant ${tenant.name}. Updating...`);
      await SmsExpirySchedule.updateOne({ _id: existingSchedule._id }, defaultScheduleData);
      console.log('Schedule updated successfully.');
    } else {
      await SmsExpirySchedule.create(defaultScheduleData);
      console.log(`SmsExpirySchedule "${defaultScheduleData.name}" created successfully for tenant ${tenant.name}.`);
    }

  } catch (error) {
    console.error('Error creating default expiry schedule:', error);
  } finally {
    mongoose.connection.close();
  }
};

createDefaultExpirySchedule();
