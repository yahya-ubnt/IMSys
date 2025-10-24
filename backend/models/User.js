const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Please add a valid phone number'],
    },
    roles: [{
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN_TENANT', 'USER'],
      required: true,
    }],
    tenantOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
const ScheduledTask = require('./ScheduledTask');

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Post-save hook to create default scheduled tasks for new ADMIN_TENANT users
UserSchema.post('save', async function (doc, next) {
  console.log(`[User.post('save')] Hook triggered for user: ${doc.fullName} (${doc._id})`);
  console.log(`[User.post('save')] isNew: ${this.isNew}, Roles: ${doc.roles}`);

  // Check if the user has the ADMIN_TENANT role
  if (doc.roles.includes('ADMIN_TENANT')) {
    console.log(`[User.post('save')] User is an ADMIN_TENANT. Checking if default tasks already exist.`);

    // Check if the tenant already has any scheduled tasks
    const existingTasksCount = await ScheduledTask.countDocuments({ tenantOwner: doc._id });

    if (existingTasksCount === 0) {
      console.log(`[User.post('save')] No existing tasks found for tenant. Proceeding to create default tasks.`);

      const defaultTasks = [
        {
          name: 'Automated Monthly Billing',
          description: 'Generates monthly bills for all active subscriptions based on the new subscription model.',
          scriptPath: 'scripts/generateBillsFromSubscriptions.js',
          schedule: '5 0 * * *', // Every day at 12:05 AM
          isEnabled: true,
        },
        {
          name: 'Automated Disconnection of Expired Users',
          description: 'Disconnects users from the network whose expiryDate has passed.',
          scriptPath: 'scripts/disconnectExpiredClients.js',
          schedule: '59 23 * * *', // Every day at 11:59 PM
          isEnabled: true,
        },
        {
          name: 'Automated Database Log Cleanup',
          description: 'Archives or deletes old log records to maintain database performance.',
          scriptPath: 'scripts/cleanupOldLogs.js',
          schedule: '5 3 * * 0', // Every Sunday at 3:05 AM
          isEnabled: true,
        },
        {
          name: 'SMS Expiry Notification',
          description: 'Sends expiry notifications to customers based on configurable schedules with robust logic.',
          scriptPath: 'scripts/sendExpiryNotifications.js',
          schedule: '0 0 * * *', // Every day at midnight',
          isEnabled: true,
        },
      ];
      console.log(`[User.post('save')] Default tasks defined: ${defaultTasks.length} tasks.`);

      try {
        for (const defaultTask of defaultTasks) {
          console.log(`[User.post('save')] Checking for existing task: "${defaultTask.name}" for tenant ${doc._id}`);
          const existingTask = await ScheduledTask.findOne({
            name: defaultTask.name,
            tenantOwner: doc._id,
          });

          if (!existingTask) {
            await ScheduledTask.create({
              ...defaultTask,
              tenantOwner: doc._id,
            });
            console.log(`[User.post('save')] Created missing task: "${defaultTask.name}" for new tenant ${doc.fullName}`);
          } else {
            console.log(`[User.post('save')] Task "${defaultTask.name}" already exists for new tenant ${doc.fullName}. Skipping.`);
          }
        }
        console.log(`[User.post('save')] Successfully processed default scheduled tasks for tenant: ${doc.fullName}`);
      } catch (error) {
        console.error(`[User.post('save')] Error processing default scheduled tasks for tenant ${doc.fullName}:`, error);
      }
    } else {
      console.log(`[User.post('save')] Existing tasks found for tenant ${doc.fullName}. Skipping default task creation.`);
    }
  } else {
    console.log(`[User.post('save')] User is NOT an ADMIN_TENANT. No default tasks created.`);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);