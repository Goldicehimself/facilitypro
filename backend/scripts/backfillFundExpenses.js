const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../DataBase/dbconnection');
const FundRequest = require('../src/models/FundRequest');
require('../src/models/User');
const financeService = require('../src/services/financeService');
const { inferExpenseCategory } = require('../src/utils/fundCategory');

const isDryRun = process.argv.includes('--dry-run');

const buildNotes = (fund) => {
  return [
    fund.purpose ? `Fund request: ${fund.purpose}` : 'Fund request approved',
    fund.notes ? `Notes: ${fund.notes}` : null
  ].filter(Boolean).join(' | ');
};

const run = async () => {
  await connectDB();

  const query = {
    status: 'approved',
    $or: [{ expenseId: { $exists: false } }, { expenseId: null }]
  };

  const funds = await FundRequest.find(query).lean();
  if (funds.length === 0) {
    console.log('No approved fund requests missing expenses.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${funds.length} approved fund requests without expenses.`);
  if (isDryRun) {
    console.log('Dry run enabled. No changes were made.');
    await mongoose.disconnect();
    return;
  }

  let created = 0;
  for (const fund of funds) {
    try {
      const category = inferExpenseCategory({ purpose: fund.purpose, notes: fund.notes });
      const expense = await financeService.createExpense(fund.organization, fund.requestedBy, {
        category,
        vendor: '',
        amount: fund.amount,
        status: 'approved',
        date: fund.decidedAt || fund.createdAt || new Date(),
        notes: buildNotes(fund)
      });
      await FundRequest.updateOne(
        { _id: fund._id },
        { $set: { expenseId: expense._id } }
      );
      created += 1;
    } catch (error) {
      console.error(`Failed to backfill fund request ${fund._id}:`, error?.message || error);
    }
  }

  console.log(`Backfill complete. Created ${created} expenses.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Backfill failed:', error?.message || error);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
