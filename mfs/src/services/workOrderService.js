import mockWorkOrders from '../mocks/mockWorkOrders';

const STORAGE_KEY = 'mock_work_orders';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    // ignore storage errors
  }
};

let _mockWorkOrders = loadFromStorage() || [...mockWorkOrders];
saveToStorage(_mockWorkOrders);

const buildAssignmentHistoryEntry = ({ prevAssignee, nextAssignee }) => ({
  at: new Date().toISOString(),
  from: prevAssignee ? { id: prevAssignee.id, name: prevAssignee.name } : null,
  to: nextAssignee ? { id: nextAssignee.id, name: nextAssignee.name } : null,
});

const ensureAssignmentHistory = (workOrder) =>
  Array.isArray(workOrder.assignmentHistory) ? workOrder.assignmentHistory : [];

export async function getWorkOrders(params = {}) {
  // Temporary mock - supports basic filtering for status / priority / search
  const { status, priority, search, assignee, category, location, dateRange } = params;
  let results = [..._mockWorkOrders];
  if (status && status !== 'all') {
    if (status === 'overdue') {
      const now = Date.now();
      results = results.filter(r => {
        const due = r.dueDate || r.scheduledDate;
        const dueTime = due ? new Date(due).getTime() : null;
        if (!dueTime || Number.isNaN(dueTime)) return r.status === 'overdue';
        return (dueTime < now) && !['completed', 'cancelled'].includes(r.status);
      });
    } else if (status === 'open') {
      results = results.filter(r => r.status === 'open' || r.status === 'to_do');
    } else {
      results = results.filter(r => r.status === status);
    }
  }
  if (priority && priority !== 'all') results = results.filter(r => r.priority === priority);
  if (assignee && assignee !== 'all') {
    results = results.filter(r => r.assignedTo?.id === assignee);
  }
  if (category && category !== 'all') {
    results = results.filter(r => (r.category || r.serviceCategory || r.serviceType) === category);
  }
  if (location && location !== 'all') {
    results = results.filter(r => (r.location?.name || r.location) === location);
  }
  if (dateRange && dateRange !== 'all') {
    const days = Number(dateRange);
    if (!Number.isNaN(days)) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      results = results.filter(r => {
        const createdAt = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        return createdAt >= cutoff;
      });
    }
  }
  if (search && search.trim()) {
    const s = search.toLowerCase();
    results = results.filter(r => (r.woNumber || '').toLowerCase().includes(s) || (r.title || '').toLowerCase().includes(s) || (r.description || '').toLowerCase().includes(s));
  }
  return results;
}

export async function getWorkOrder(id) {
  return _mockWorkOrders.find(w => w.id === id) || null;
}

export async function createWorkOrder(payload) {
  // mock create - in real app replace with API call
  const initialAssignee = payload.assignedTo || null;
  const newWO = {
    id: `wo-${Date.now()}`,
    woNumber: `WO-${1000 + Math.floor(Math.random() * 9000)}`,
    ...payload,
    category: payload.category || payload.serviceCategory || payload.serviceType || payload.category,
    status: payload.status || 'open',
    createdAt: new Date().toISOString(),
    assignedTo: initialAssignee,
    assignmentHistory: initialAssignee
      ? [buildAssignmentHistoryEntry({ prevAssignee: null, nextAssignee: initialAssignee })]
      : [],
    reassignedCount: 0,
  };
  _mockWorkOrders = [newWO, ..._mockWorkOrders];
  saveToStorage(_mockWorkOrders);
  return newWO;
}

export async function deleteWorkOrder(id) {
  const before = _mockWorkOrders.length;
  _mockWorkOrders = _mockWorkOrders.filter(w => w.id !== id);
  saveToStorage(_mockWorkOrders);
  return before !== _mockWorkOrders.length;
}

export async function assignWorkOrder(id, assignee) {
  let updated = null;
  _mockWorkOrders = _mockWorkOrders.map(w => {
    if (w.id === id) {
      const prevAssignee = w.assignedTo || null;
      const nextAssignee = assignee || null;
      const history = ensureAssignmentHistory(w);
      const hasChanged =
        (prevAssignee?.id || null) !== (nextAssignee?.id || null);
      updated = {
        ...w,
        assignedTo: nextAssignee,
        assignmentHistory: hasChanged
          ? [...history, buildAssignmentHistoryEntry({ prevAssignee, nextAssignee })]
          : history,
        reassignedCount: hasChanged && prevAssignee ? (w.reassignedCount || 0) + 1 : (w.reassignedCount || 0),
      };
      return updated;
    }
    return w;
  });
  saveToStorage(_mockWorkOrders);
  return updated;
}

export async function bulkAssignWorkOrders({ ids = null, assignee = null, filters = {} } = {}) {
  // If ids is null, apply to all matching items by filters
  let targets = [];
  if (!ids) {
    targets = await getWorkOrders(filters);
  } else {
    targets = _mockWorkOrders.filter(w => ids.includes(w.id));
  }

  let updatedCount = 0;
  _mockWorkOrders = _mockWorkOrders.map(w => {
    if (targets.find(t => t.id === w.id)) {
      const prevAssignee = w.assignedTo || null;
      const nextAssignee = assignee || null;
      const history = ensureAssignmentHistory(w);
      const hasChanged =
        (prevAssignee?.id || null) !== (nextAssignee?.id || null);
      updatedCount += 1;
      return {
        ...w,
        assignedTo: nextAssignee,
        assignmentHistory: hasChanged
          ? [...history, buildAssignmentHistoryEntry({ prevAssignee, nextAssignee })]
          : history,
        reassignedCount: hasChanged && prevAssignee ? (w.reassignedCount || 0) + 1 : (w.reassignedCount || 0),
      };
    }
    return w;
  });

  saveToStorage(_mockWorkOrders);
  return { updatedCount, updatedIds: targets.map(t => t.id) };
}
