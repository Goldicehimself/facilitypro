require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('../DataBase/dbconnection');
const Organization = require('../src/models/Organization');
const { normalizeSettings } = require('../src/services/orgService');
const logger = require('../src/utils/logger');

const run = async () => {
  try {
    await connectDB();

    const orgs = await Organization.find({});
    let updated = 0;

    for (const org of orgs) {
      const normalized = normalizeSettings(org);
      org.settings = normalized;
      await org.save();
      updated += 1;
    }

    logger.info(`[migrate-org-settings] Updated ${updated} organizations`);
    process.exit(0);
  } catch (error) {
    logger.error('[migrate-org-settings] Failed', error?.message || error);
    process.exit(1);
  }
};

run();
