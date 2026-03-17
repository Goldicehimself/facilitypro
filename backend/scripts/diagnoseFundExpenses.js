const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../DataBase/dbconnection');
const FundRequest = require('../src/models/FundRequest');
const Expense = require('../src/models/Expense');

const extractPurpose = (notes = '') => {
  const match = String(notes).match(/Fund request:\s*([^|]+)(\||$)/i);
  return match ? match[1].trim() : '';
};

const buildKey = (expense) => {
  const purpose = extractPurpose(expense.notes);
  return [
    String(expense.organization || ''),
    String(expense.submittedBy || ''),
    String(expense.amount || ''),
    purpose.toLowerCase()
  ].join('|');
};

const run = async () => {
  await connectDB();

  const fundExpenses = await Expense.find({
    notes: { $regex: /Fund request:/i }
  }).lean();

  const byKey = new Map();
  for (const exp of fundExpenses) {
    const key = buildKey(exp);
    const list = byKey.get(key) || [];
    list.push(exp);
    byKey.set(key, list);
  }

  const duplicates = [];
  for (const [key, list] of byKey.entries()) {
    if (list.length > 1) {
      duplicates.push({ key, list });
    }
  }

  console.log(`Fund-request expenses found: ${fundExpenses.length}`);
  console.log(`Duplicate groups found: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('Duplicate details:');
    duplicates.forEach((group, idx) => {
      const sample = group.list[0];
      console.log(`\n#${idx + 1} key=${group.key}`);
      console.log(`Purpose: ${extractPurpose(sample.notes) || '(unknown)'}`);
      group.list.forEach((exp) => {
        console.log(`- expenseId=${exp._id} amount=${exp.amount} createdAt=${exp.createdAt}`);
      });
    });
  }

  // Check fund requests missing expenseId
  const missing = await FundRequest.find({
    status: 'approved',
    $or: [{ expenseId: { $exists: false } }, { expenseId: null }]
  }).lean();
  console.log(`\nApproved fund requests missing expenseId: ${missing.length}`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Diagnostic failed:', error?.message || error);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});

