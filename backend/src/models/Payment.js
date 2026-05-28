const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  fee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  amount_paid: { type: Number, required: true },
  payment_method: { type: String, required: true },
  transaction_id: { type: String },
  received_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
