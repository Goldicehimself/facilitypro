import axiosInstance from './axiosConfig';
import * as workOrderService from '../services/workOrderService';

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
    createdBy: normalizeUserRef(wo.createdBy),
    assignedTo: normalizeUserRef(wo.assignedTo),
    team: Array.isArray(wo.team) ? wo.team.map(normalizeUserRef) : wo.team,
    comments: Array.isArray(wo.comments)
      ? wo.comments.map((c) => ({ ...c, user: normalizeUserRef(c.user) }))
      : wo.comments,
  };
};

export const getWorkOrders = async (params = {}) => {
  try {
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
  } catch (error) {
    if (!error?.response) {
      return await workOrderService.getWorkOrders(params);
    }
    return {
      workOrders: [],
      pagination: {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: 0
      }
    };
  }
};

export const getWorkOrder = async (id) => {
  try {
    const response = await axiosInstance.get(`/work-orders/${id}`, { suppressToast: true });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    return await workOrderService.getWorkOrder(id);
  }
};

export const createWorkOrder = async (data) => {
  try {
    const response = await axiosInstance.post('/work-orders', data, { suppressToast: true });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    return await workOrderService.createWorkOrder(data);
  }
};

export const updateWorkOrder = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/work-orders/${id}`, data, { suppressToast: true });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    // Best-effort: update in local mock if present
    const existing = await workOrderService.getWorkOrder(id);
    if (existing) {
      const updated = { ...existing, ...data };
      await workOrderService.deleteWorkOrder(id);
      await workOrderService.createWorkOrder(updated);
      return updated;
    }
    throw error;
  }
};

export const deleteWorkOrder = async (id) => {
  try {
    const response = await axiosInstance.delete(`/work-orders/${id}`, { suppressToast: true });
    return response.data?.data;
  } catch (error) {
    return await workOrderService.deleteWorkOrder(id);
  }
};

export const updateWorkOrderStatus = async (id, status, notes = '') => {
  try {
    const response = await axiosInstance.patch(`/work-orders/${id}/status`, {
      status,
      notes,
    }, { suppressToast: true });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    const wo = await workOrderService.getWorkOrder(id);
    if (wo) {
      const updated = { ...wo, status };
      await workOrderService.deleteWorkOrder(id);
      await workOrderService.createWorkOrder(updated);
      return updated;
    }
    throw error;
  }
};

export const assignWorkOrder = async (id, assigneeId) => {
  try {
    const response = await axiosInstance.post(`/work-orders/${id}/assign`, {
      assigneeId,
    });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    const wo = await workOrderService.getWorkOrder(id);
    let assignee = null;
    if (assigneeId) {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      assignee =
        localUsers.find((u) => u.id === assigneeId) ||
        (wo?.potentialAssignees || []).find((u) => u.id === assigneeId) ||
        { id: assigneeId, name: `User ${assigneeId}` };
    }
    if (wo) {
      return await workOrderService.assignWorkOrder(id, assignee);
    }
    throw error;
  }
};

export const addWorkOrderComment = async (id, comment) => {
  try {
    const response = await axiosInstance.post(`/work-orders/${id}/comments`, {
      comment,
    });
    return normalizeWorkOrder(response.data?.data);
  } catch (error) {
    // Not implemented in mock
    throw error;
  }
};

export const uploadWorkOrderPhoto = async (id, files) => {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  fileList.filter(Boolean).forEach((file) => {
    formData.append('photos', file);
  });
  
  try {
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
  } catch (error) {
    throw error;
  }
};

export const getWorkOrderStats = async () => {
  try {
    const response = await axiosInstance.get('/work-orders/stats');
    return response.data?.data;
  } catch (error) {
    // Basic local stats fallback
    const arr = await workOrderService.getWorkOrders();
    return {
      total: arr.length,
      open: arr.filter(w => w.status === 'open').length,
      inProgress: arr.filter(w => w.status === 'in_progress').length,
      completed: arr.filter(w => w.status === 'completed').length,
      overdue: arr.filter(w => w.status === 'overdue').length,
    };
  }
};

export const bulkAssignWorkOrders = async ({ ids = null, assignee = null, filters = {} } = {}) => {
  try {
    const response = await axiosInstance.post('/work-orders/bulk-assign', { ids, assignee, filters });
    return response.data?.data;
  } catch (error) {
    // Fallback to local mock
    return await workOrderService.bulkAssignWorkOrders({ ids, assignee, filters });
  }
};
