/* Seed finance invoices, expenses, and vendor documents */
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = require('../DataBase/dbconnection');
const Organization = require('../src/models/Organization');
const Vendor = require('../src/models/Vendor');
const User = require('../src/models/User');
const Invoice = require('../src/models/Invoice');
const Expense = require('../src/models/Expense');
const VendorDocument = require('../src/models/VendorDocument');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  await connectDB();

  const organization = await Organization.findOne().lean();
  if (!organization) {
    console.log('No organization found. Create an organization first.');
    process.exit(1);
  }

  const vendor = await Vendor.findOne({ organization: organization._id }).lean();
  if (!vendor) {
    console.log('No vendor found. Create a vendor first.');
    process.exit(1);
  }

  const financeUser = await User.findOne({ organization: organization._id, role: { $in: ['finance', 'admin'] } }).lean();
  if (!financeUser) {
    console.log('No finance/admin user found. Create a finance user first.');
    process.exit(1);
  }

  const isReset = process.argv.includes('--reset');
  if (isReset) {
    await Promise.all([
      Invoice.deleteMany({ organization: organization._id }),
      Expense.deleteMany({ organization: organization._id }),
      VendorDocument.deleteMany({ organization: organization._id })
    ]);
  }

  const invoiceStatuses = ['pending', 'paid', 'overdue'];
  const expenseStatuses = ['pending', 'approved'];

  const invoices = Array.from({ length: 6 }).map((_, idx) => ({
    organization: organization._id,
    vendor: vendor._id,
    clientName: vendor.name,
    amount: 1500 + idx * 450,
    status: pick(invoiceStatuses),
    issueDate: new Date(Date.now() - (idx + 2) * 86400000),
    dueDate: new Date(Date.now() + (idx + 5) * 86400000),
    description: `Service invoice #${idx + 1}`,
    createdBy: financeUser._id
  }));

  const expenses = Array.from({ length: 5 }).map((_, idx) => ({
    organization: organization._id,
    category: pick(['Parts & Materials', 'Labor', 'Travel', 'Equipment']),
    vendor: pick([vendor.name, 'Internal']),
    amount: 300 + idx * 120,
    status: pick(expenseStatuses),
    date: new Date(Date.now() - (idx + 1) * 86400000),
    submittedBy: financeUser._id,
    notes: 'Seeded expense entry'
  }));

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
  const docs = [
    {
      organization: organization._id,
      vendor: vendor._id,
      name: 'Insurance Certificate',
      type: 'application/pdf',
      url: `https://res.cloudinary.com/${cloudName}/image/upload/v1700000000/facilitypro/demo-doc.pdf`,
      size: '220 KB',
      uploadedBy: financeUser._id
    },
    {
      organization: organization._id,
      vendor: vendor._id,
      name: 'Compliance Report',
      type: 'application/pdf',
      url: `https://res.cloudinary.com/${cloudName}/image/upload/v1700000000/facilitypro/demo-report.pdf`,
      size: '180 KB',
      uploadedBy: financeUser._id
    }
  ];

  await Invoice.insertMany(invoices);
  await Expense.insertMany(expenses);
  await VendorDocument.insertMany(docs);

  console.log('Seeded invoices, expenses, and vendor documents.');
  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
