const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../DataBase/dbconnection');
const Expense = require('../src/models/Expense');
const FundRequest = require('../src/models/FundRequest');

const [olderId, newerId] = process.argv.slice(2);

if (!olderId || !newerId) {
  console.error('Usage: node scripts/deleteDuplicateFundExpense.js <olderExpenseId> <newerExpenseId>');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const [older, newer] = await Promise.all([
    Expense.findById(olderId),
    Expense.findById(newerId)
  ]);

  if (!older || !newer) {
    console.error('Could not find both expenses. Aborting.');
    await mongoose.disconnect();
    process.exit(1);
  }

  await FundRequest.updateMany({ expenseId: newer._id }, { $set: { expenseId: older._id } });
  const del = await Expense.deleteOne({ _id: newer._id });
  console.log('Deleted newer expense', newer._id.toString(), 'deletedCount', del.deletedCount);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Delete failed:', error?.message || error);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});

