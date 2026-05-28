import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for general school expenses like utility bills
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'] 
  },
  category: { 
    type: String, 
    enum: ['Tuition', 'Salary', 'Maintenance', 'Utilities', 'Other'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Income', 'Expense'], 
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Clean ESM Default Export
const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;