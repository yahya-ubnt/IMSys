const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema(
  {
    ticketRef: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: false,
    },
    clientAccountId: {
      type: String,
      required: false,
    },
    issueType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["New", "Open", "In Progress", "Dispatched", "Fixed", "Closed"],
      default: "New",
    },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);



const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
