require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

(async () => {
  try {
    await mongoose.connect(process.env.DBSTRING, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('DB connected');
    const org = await Organization.findOne().lean();
    const admin = await User.findOne({ role: 'admin', active: true, organization: org._id }).lean();
    console.log('Found org/admin', org ? org._id : null, admin ? admin._id : null);

    const n = await Notification.create({
      user: admin._id,
      organization: org._id,
      title: 'Test notification',
      message: 'Created from script',
      type: 'leave_request_submitted',
      entityType: 'LeaveRequest',
      entityId: mongoose.Types.ObjectId(),
      link: '/leave-center'
    });
    console.log('Created notification', n._id.toString());

    const bulk = await Notification.insertMany([
      {
        user: admin._id,
        organization: org._id,
        title: 'Test bulk',
        message: 'Test message bulk',
        type: 'leave_request_submitted',
        entityType: 'LeaveRequest',
        entityId: mongoose.Types.ObjectId(),
        link: '/leave-center'
      }
    ], { ordered: false });
    console.log('Bulk insert result length', bulk.length);
    console.log('Bulk insert result first', bulk[0]._id.toString());

    await mongoose.disconnect();
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  }
})();