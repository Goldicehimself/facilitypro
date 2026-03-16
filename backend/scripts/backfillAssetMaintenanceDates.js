require('dotenv').config();

const mongoose = require('mongoose');
const Asset = require('../src/models/Asset');

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const run = async () => {
  const dryRun = process.argv.includes('--dry-run');
  if (!process.env.DBSTRING) {
    throw new Error('DBSTRING is not set');
  }

  await mongoose.connect(process.env.DBSTRING);

  const assets = await Asset.find({
    maintenanceSchedule: { $exists: true, $ne: [] }
  }).select('_id maintenanceSchedule lastMaintenance lastMaintenanceDate nextService nextMaintenanceDate');

  let updated = 0;

  for (const asset of assets) {
    const scheduleItems = Array.isArray(asset.maintenanceSchedule) ? asset.maintenanceSchedule : [];
    const scheduleLastDates = scheduleItems
      .map((item) => parseDate(item?.last))
      .filter(Boolean);
    const scheduleNextDates = scheduleItems
      .map((item) => parseDate(item?.next))
      .filter(Boolean);

    const derivedLast = scheduleLastDates.length
      ? new Date(Math.max(...scheduleLastDates.map((d) => d.getTime())))
      : null;
    const derivedNext = scheduleNextDates.length
      ? new Date(Math.min(...scheduleNextDates.map((d) => d.getTime())))
      : null;

    const needsLast = !asset.lastMaintenance && !asset.lastMaintenanceDate && derivedLast;
    const needsNext = !asset.nextService && !asset.nextMaintenanceDate && derivedNext;

    if (needsLast || needsNext) {
      updated += 1;
      if (!dryRun) {
        await Asset.updateOne(
          { _id: asset._id },
          {
            ...(needsLast ? { $set: { lastMaintenance: derivedLast, lastMaintenanceDate: derivedLast } } : {}),
            ...(needsNext ? { $set: { nextService: derivedNext, nextMaintenanceDate: derivedNext } } : {})
          }
        );
      }
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
