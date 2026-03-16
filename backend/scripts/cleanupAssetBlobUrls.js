require('dotenv').config();

const mongoose = require('mongoose');
const Asset = require('../src/models/Asset');

const isBadUrl = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('blob:') || trimmed.startsWith('data:');
};

const filterUrls = (arr) => {
  if (!Array.isArray(arr)) return arr;
  const next = arr.filter((v) => !isBadUrl(v));
  return next;
};

const run = async () => {
  const dryRun = process.argv.includes('--dry-run');
  if (!process.env.DBSTRING) {
    throw new Error('DBSTRING is not set');
  }

  await mongoose.connect(process.env.DBSTRING);

  const assets = await Asset.find({
    $or: [
      { imageUrl: { $regex: '^(blob:|data:)', $options: 'i' } },
      { imageUrls: { $elemMatch: { $regex: '^(blob:|data:)', $options: 'i' } } },
      { images: { $elemMatch: { $regex: '^(blob:|data:)', $options: 'i' } } }
    ]
  }).select('_id imageUrl imageUrls images');

  let updated = 0;

  for (const asset of assets) {
    const next = {};
    let changed = false;

    if (isBadUrl(asset.imageUrl)) {
      next.imageUrl = undefined;
      changed = true;
    }

    if (Array.isArray(asset.imageUrls)) {
      const filtered = filterUrls(asset.imageUrls);
      if (filtered.length !== asset.imageUrls.length) {
        next.imageUrls = filtered.length ? filtered : undefined;
        changed = true;
      }
    }

    if (Array.isArray(asset.images)) {
      const filtered = filterUrls(asset.images);
      if (filtered.length !== asset.images.length) {
        next.images = filtered.length ? filtered : undefined;
        changed = true;
      }
    }

    if (changed) {
      updated += 1;
      if (!dryRun) {
        await Asset.updateOne({ _id: asset._id }, { $set: next, $unset: {
          ...(next.imageUrl === undefined ? { imageUrl: '' } : {}),
          ...(next.imageUrls === undefined ? { imageUrls: '' } : {}),
          ...(next.images === undefined ? { images: '' } : {})
        } });
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
  console.error('Cleanup failed:', err);
  process.exit(1);
});
