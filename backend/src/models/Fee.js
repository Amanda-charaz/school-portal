import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  base_amount: { type: Number, default: 0 }, // New field for base tuition
  discount: { type: Number, default: 0 },    // New field for discounts
  fines: { type: Number, default: 0 },       // New field for fines
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  due_date: { type: Date },
  term: { type: String },
  year: { type: Number, required: true, default: () => new Date().getFullYear() }, // New field for year
  received_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
