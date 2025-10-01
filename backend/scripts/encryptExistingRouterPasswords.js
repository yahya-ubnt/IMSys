require('../config/env'); // Load environment variables
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikRouter = require('../models/MikrotikRouter');
const { encrypt, decrypt } = require('../utils/crypto');

const encryptPasswords = async () => {
  await connectDB();

  const routers = await MikrotikRouter.find({});
  let processedCount = 0;

  for (const router of routers) {
    try {
      // Attempt to decrypt. If it fails, the password is likely plaintext.
      JSON.parse(router.apiPassword);
      console.log(`Router "${router.name}" password already seems to be encrypted. Skipping.`);
    } catch (e) {
      // If JSON.parse fails, it's not our encrypted format.
      console.log(`Encrypting password for router "${router.name}"...`);
      const encryptedPassword = encrypt(router.apiPassword);
      router.apiPassword = encryptedPassword;
      await router.save();
      processedCount++;
      console.log(`...done.`);
    }
  }

  console.log(`
Encryption script finished. Processed ${processedCount} router(s).
`);
  process.exit();
};

encryptPasswords();