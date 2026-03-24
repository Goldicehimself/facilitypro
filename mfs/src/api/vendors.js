import axiosInstance from './axiosConfig';

const normalizeVendor = (vendor) => {
  if (!vendor) return vendor;
  return {
    ...vendor,
    id: vendor.id || vendor._id,
  };
};

export async function fetchVendors() {
  const response = await axiosInstance.get('/vendors');
  const payload = response.data?.data;
  if (Array.isArray(payload)) return payload.map(normalizeVendor);
  if (Array.isArray(payload?.vendors)) {
    return { ...payload, vendors: payload.vendors.map(normalizeVendor) };
  }
  return payload;
}

export async function getVendorById(id) {
  const response = await axiosInstance.get(`/vendors/${id}`);
  return normalizeVendor(response.data?.data);
}

export async function createVendor(vendorData) {
  const response = await axiosInstance.post('/vendors', vendorData);
  return normalizeVendor(response.data?.data);
}

export async function updateVendor(id, vendorData) {
  const response = await axiosInstance.put(`/vendors/${id}`, vendorData);
  return normalizeVendor(response.data?.data);
}

export async function deleteVendor(id) {
  await axiosInstance.delete(`/vendors/${id}`);
}

export async function fetchVendorAnalytics(rangeDays = 30) {
  const response = await axiosInstance.get('/vendors/analytics', {
    params: { range: rangeDays }
  });
  return response.data?.data;
}

export async function importVendors(vendors) {
  const response = await axiosInstance.post('/vendors/import', { vendors });
  return response.data?.data;
}

const normalizeVendorDocument = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc.id || doc._id,
    uploadDate: doc.uploadDate || doc.uploadedAt || doc.createdAt
  };
};

export async function getVendorDocuments(vendorId, params = {}) {
  const response = await axiosInstance.get(`/vendors/${vendorId}/documents`, { params, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeVendorDocument);
  }
  if (Array.isArray(payload?.documents)) {
    return { ...payload, documents: payload.documents.map(normalizeVendorDocument) };
  }
  return payload;
}

export async function createVendorDocument(vendorId, data) {
  const response = await axiosInstance.post(`/vendors/${vendorId}/documents`, data);
  return normalizeVendorDocument(response.data?.data);
}

export async function uploadVendorDocument(vendorId, file, metadata = {}) {
  const formData = new FormData();
  formData.append('document', file);
  if (metadata.name) formData.append('name', metadata.name);
  if (metadata.type) formData.append('type', metadata.type);
  if (metadata.size) formData.append('size', metadata.size);

  const response = await axiosInstance.post(`/vendors/${vendorId}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return normalizeVendorDocument(response.data?.data);
}

export async function deleteVendorDocument(vendorId, documentId) {
  const response = await axiosInstance.delete(`/vendors/${vendorId}/documents/${documentId}`);
  return response.data?.data;
}

export async function updateVendorDocument(vendorId, documentId, data) {
  const response = await axiosInstance.put(`/vendors/${vendorId}/documents/${documentId}`, data);
  return normalizeVendorDocument(response.data?.data);
}

export async function getVendorPerformance(vendorId) {
  const response = await axiosInstance.get(`/vendors/${vendorId}/performance`, { suppressToast: true });
  return response.data?.data;
}
