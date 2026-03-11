import * as assetService from '../src/services/assetService.js';

async function run() {
  console.log('Fetching asset-1 before update...');
  const before = await assetService.getAsset('asset-1');
  console.log('Before serial:', before.serial);

  console.log('Updating serial to SN-TEST-999...');
  const updated = await assetService.updateAsset('asset-1', { serial: 'SN-TEST-999' });
  console.log('Update result serial:', updated.serial);

  const after = await assetService.getAsset('asset-1');
  console.log('After serial:', after.serial);

  // Revert change to original serial for cleanliness
  await assetService.updateAsset('asset-1', { serial: 'CR2019A5001234' });
  console.log('Reverted serial to original.');
}

run().catch(err => { console.error(err); process.exit(1); });