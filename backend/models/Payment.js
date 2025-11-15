const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'credit_card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePaymentIntentId: {
    type: String
  },
  paypalOrderId: {
    type: String
  },
  receiptUrl: {
    type: String
  },
  invoiceUrl: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ course: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
