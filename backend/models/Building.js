const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: [true, 'Please provide a building name'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: { type: String },
      lng: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

buildingSchema.index({ tenant: 1, name: 1 }, { unique: true });

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;
