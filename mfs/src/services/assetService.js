import mockAssets from '../mocks/mockAssets.js';

let _mockAssets = [...mockAssets];

export async function getAssets(params = {}) {
  // Supports pagination, filtering and search
  const { page = 1, limit = 8, search = '', category = '', location = '', status = '', sort = 'name' } = params;

  let results = [..._mockAssets];
  if (search && String(search).trim()) {
    const s = search.toLowerCase();
    results = results.filter(a => (a.name || '').toLowerCase().includes(s) || (a.assetTag || '').toLowerCase().includes(s) || (a.id || '').toLowerCase().includes(s));
  }
  if (category) results = results.filter(a => a.category === category);
  if (location) results = results.filter(a => (a.location || '').toLowerCase().includes(String(location).toLowerCase()));
  if (status) results = results.filter(a => a.status === status);

  // Simple sort
  results.sort((x, y) => {
    if (sort === 'name') return (x.name || '').localeCompare(y.name || '');
    if (sort === 'date_added') return new Date(y.purchaseDate) - new Date(x.purchaseDate);
    return 0;
  });

  const total = results.length;
  const start = (page - 1) * limit;
  const data = results.slice(start, start + limit);

  // Match API response shape used in AssetList
  return { data, total };
}

export async function getAsset(id) {
  return _mockAssets.find(a => a.id === id) || null;
}

export async function createAsset(payload) {
  const newAsset = { id: `asset-${Date.now()}`, ...payload };
  _mockAssets = [newAsset, ..._mockAssets];
  return newAsset;
}

export async function deleteAsset(id) {
  const before = _mockAssets.length;
  _mockAssets = _mockAssets.filter(a => a.id !== id);
  return before !== _mockAssets.length;
}

export async function updateAsset(id, data) {
  const idx = _mockAssets.findIndex(a => a.id === id);
  if (idx === -1) return null;
  _mockAssets[idx] = { ..._mockAssets[idx], ...data };
  return _mockAssets[idx];
}
