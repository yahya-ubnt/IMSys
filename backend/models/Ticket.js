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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    notes: [
      {
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);



const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
