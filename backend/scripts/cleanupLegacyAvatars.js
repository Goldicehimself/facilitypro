require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

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

  logger.info(`Cleared legacy avatars: matched=${result.matchedCount} modified=${result.modifiedCount}`);
};

run()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    logger.error('[cleanupLegacyAvatars] failed', err?.message || err);
    mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
