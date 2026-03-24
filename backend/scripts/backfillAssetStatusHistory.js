require('dotenv').config();

const mongoose = require('mongoose');
const Asset = require('../src/models/Asset');

const run = async () => {
  const dryRun = process.argv.includes('--dry-run');
  if (!process.env.DBSTRING) {
    throw new Error('DBSTRING is not set');
  }

  await mongoose.connect(process.env.DBSTRING);

  const assets = await Asset.find({
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: { $size: 0 } }
    ]
  }).select('_id status createdAt updatedAt');

  let updated = 0;

  for (const asset of assets) {
    const status = asset.status || 'active';
    const changedAt = asset.createdAt || asset.updatedAt || new Date();

    updated += 1;
    if (!dryRun) {
      await Asset.updateOne(
        { _id: asset._id },
        {
          $set: {
            statusHistory: [{
              status,
              changedAt
            }]
          }
        }
      );
    }
  }

  console.log(`Scanned: ${assets.length}`);
  console.log(`Will update: ${updated}`);
  if (dryRun) {
    console.log('Dry run only. Re-run without --dry-run to apply changes.');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
