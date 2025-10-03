const mongoose = require('mongoose');
const crypto = require('crypto');

// Ensure the encryption key is set
if (!process.env.ENCRYPTION_KEY || Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error('FATAL ERROR: ENCRYPTION_KEY is not defined or is not a 32-byte hex string.');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Encryption and Decryption functions
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (text) => {
  if (!text || !text.iv || !text.encryptedData) return null;
  try {
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error("Failed to decrypt credentials:", error);
    return null;
  }
};

const whatsAppProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Provider name is required.'],
    trim: true,
    unique: true,
  },
  providerType: {
    type: String,
    required: [true, 'Provider type is required.'],
    enum: ['twilio'], // Initially only supporting Twilio
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    set: encrypt,
    get: decrypt,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

// Middleware to ensure only one provider is active at a time
whatsAppProviderSchema.pre('save', async function (next) {
  if (this.isActive && this.isModified('isActive')) {
    await this.constructor.updateMany({ _id: { $ne: this._id }, isActive: true }, { isActive: false });
  }
  const count = await this.constructor.countDocuments();
  if (count === 0) {
      this.isActive = true;
  }
  next();
});

const WhatsAppProvider = mongoose.model('WhatsAppProvider', whatsAppProviderSchema);

module.exports = WhatsAppProvider;