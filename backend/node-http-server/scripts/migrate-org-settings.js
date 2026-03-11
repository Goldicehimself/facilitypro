require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('../DataBase/dbconnection');
const Organization = require('../src/models/Organization');
const { normalizeSettings } = require('../src/services/orgService');

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

    console.log(`[migrate-org-settings] Updated ${updated} organizations`);
    process.exit(0);
  } catch (error) {
    console.error('[migrate-org-settings] Failed', error);
    process.exit(1);
  }
};

run();
