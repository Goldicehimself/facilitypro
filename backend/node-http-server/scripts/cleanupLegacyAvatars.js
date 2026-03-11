require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const run = async () => {
  const mongoUrl = process.env.DBSTRING;
  if (!mongoUrl) {
    throw new Error('DBSTRING is not set in environment');
  }

  await mongoose.connect(mongoUrl);

  const result = await User.updateMany(
    {
      avatar: { $type: 'string', $regex: /(\/|^)uploads\//i }
    },
    { $set: { avatar: null } }
  );

  console.log(`Cleared legacy avatars: matched=${result.matchedCount} modified=${result.modifiedCount}`);
};

run()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('[cleanupLegacyAvatars] failed', err);
    mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
