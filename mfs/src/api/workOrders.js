import axiosInstance from './axiosConfig';

const normalizeUserRef = (user) => {
  if (!user) return user;
  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');
  return {
    ...user,
    id: user.id || user._id,
    name,
  };
};

const normalizeWorkOrder = (wo) => {
  if (!wo) return wo;
  return {
    ...wo,
    id: wo.id || wo._id,
    woNumber: wo.woNumber || wo.workOrderNumber,
    startedAt: wo.startedAt || wo.startDate,
    completedAt: wo.completedAt || wo.completionDate,
    createdBy: normalizeUserRef(wo.createdBy),
    assignedTo: normalizeUserRef(wo.assignedTo),
    team: Array.isArray(wo.team) ? wo.team.map(normalizeUserRef) : wo.team,
    comments: Array.isArray(wo.comments)
      ? wo.comments.map((c) => ({ ...c, user: normalizeUserRef(c.user) }))
      : wo.comments,
  };
};

export const getWorkOrders = async (params = {}) => {
  const mappedParams = { ...params };
  if (mappedParams.assignee && !mappedParams.assignedTo) {
    mappedParams.assignedTo = mappedParams.assignee;
    delete mappedParams.assignee;
  }
  const response = await axiosInstance.get('/work-orders', { params: mappedParams, suppressToast: true });
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(normalizeWorkOrder);
  }
  if (Array.isArray(payload?.workOrders)) {
    return {
      ...payload,
      workOrders: payload.workOrders.map(normalizeWorkOrder),
    };
  }
  return payload;
};

export const getWorkOrder = async (id) => {
  const response = await axiosInstance.get(`/work-orders/${id}`, { suppressToast: true });
  return normalizeWorkOrder(response.data?.data);
};

export const createWorkOrder = async (data) => {
  const response = await axiosInstance.post('/work-orders', data, { suppressToast: true });
  return normalizeWorkOrder(response.data?.data);
};

export const updateWorkOrder = async (id, data) => {
  const response = await axiosInstance.put(`/work-orders/${id}`, data, { suppressToast: true });
  return normalizeWorkOrder(response.data?.data);
};

export const deleteWorkOrder = async (id) => {
  const response = await axiosInstance.delete(`/work-orders/${id}`, { suppressToast: true });
  return response.data?.data;
};

export const updateWorkOrderStatus = async (id, status, notes = '', meta = {}) => {
  const response = await axiosInstance.patch(
    `/work-orders/${id}/status`,
    { status, notes, ...meta },
    { suppressToast: true }
  );
  return normalizeWorkOrder(response.data?.data);
};

export const assignWorkOrder = async (id, assigneeId) => {
  const response = await axiosInstance.post(`/work-orders/${id}/assign`, {
    assigneeId,
  });
  return normalizeWorkOrder(response.data?.data);
};

export const addWorkOrderComment = async (id, comment) => {
  const response = await axiosInstance.post(`/work-orders/${id}/comments`, {
    comment,
  });
  return normalizeWorkOrder(response.data?.data);
};

export const uploadWorkOrderPhoto = async (id, files) => {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  fileList.filter(Boolean).forEach((file) => {
    formData.append('photos', file);
  });

  const response = await axiosInstance.post(
    `/work-orders/${id}/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data?.data;
};

export const uploadWorkOrderReceipt = async (id, files) => {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  fileList.filter(Boolean).forEach((file) => {
    formData.append('receipts', file);
  });

  const response = await axiosInstance.post(
    `/work-orders/${id}/receipts`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data?.data;
};

export const uploadWorkOrderAttachments = async (id, files) => {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  fileList.filter(Boolean).forEach((file) => {
    formData.append('documents', file);
  });

  const response = await axiosInstance.post(
    `/work-orders/${id}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data?.data;
};

export const notifyWorkOrderUpdate = async (id) => {
  const response = await axiosInstance.post(`/work-orders/${id}/notify`);
  return response.data?.data;
};

export const getWorkOrderStats = async () => {
  const response = await axiosInstance.get('/work-orders/stats');
  return response.data?.data;
};

export const bulkAssignWorkOrders = async ({ ids = null, assignee = null, filters = {} } = {}) => {
  const response = await axiosInstance.post('/work-orders/bulk-assign', { ids, assignee, filters });
  return response.data?.data;
};
