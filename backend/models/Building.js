// backend/models/Building.js
const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  address: { type: String, required: true },
  gps: {
    lat: { type: Number },
    lng: { type: Number },
  },
  owner: { type: String },
  staffName: { type: String },
  staffPhone: {
    type: String,
    validate: {
      validator: function(v) {
        return v === '' || /^\+?\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  notes: { type: String },
  images: [{ type: String }],
  providers: [{ type: String }],
  totalUnits: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["completed", "in-progress"],
    default: "in-progress",
  },
  equipment: [ // New field
    {
      deviceName: { type: String, required: true },
      ipAddress: { type: String },
      username: { type: String },
      password: { type: String },
      type: { type: String, default: "Ubiquiti Antenna" }
    }
  ],
  reversePoeSwitches: [ // Added Reverse PoE Switches field
    {
      count: { type: Number, default: 1 },
      serialNumber: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Building', buildingSchema);