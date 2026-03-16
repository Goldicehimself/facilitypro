// Application Constants
module.exports = {
  PORT: process.env.PORT || process.env.EXPRESS_PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URL: process.env.DBSTRING,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_EXPIRE_SHORT: process.env.JWT_EXPIRE_SHORT || '1d',
  JWT_EXPIRE_LONG: process.env.JWT_EXPIRE_LONG || '30d',
  
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  
  // File Upload
  MAX_FILE_SIZE: 5242880, // 5MB in bytes
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Role Constants
  ROLES: {
    ADMIN: 'admin',
    FACILITY_MANAGER: 'facility_manager',
    TECHNICIAN: 'technician',
    STAFF: 'staff',
    VENDOR: 'vendor',
    FINANCE: 'finance',
    PROCUREMENT: 'procurement',
    USER: 'user'
  },
  
  // Work Order Status
  WORK_ORDER_STATUS: {
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on_hold'
  },
  
  // Asset Status
  ASSET_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
    RETIRED: 'retired'
  },
  
  // Priority Levels
  PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  // Maintenance Types
  MAINTENANCE_TYPE: {
    PREVENTIVE: 'preventive',
    CORRECTIVE: 'corrective',
    EMERGENCY: 'emergency'
  },

  // API Key Scopes
  API_KEY_SCOPES: [
    'workorders:read',
    'workorders:write',
    'assets:read',
    'assets:write',
    'vendors:read',
    'reports:read',
    'inventory:read',
    'inventory:write',
    'service-requests:read',
    'service-requests:write',
    'finance:read',
    'finance:write'
  ],

  DEFAULT_API_KEY_RATE_LIMIT: {
    windowMs: 60 * 1000,
    max: 60
  },

  WEBHOOK_EVENTS: [
    'workorder.created',
    'workorder.assigned',
    'workorder.status_changed',
    'workorder.overdue',
    'pm.due'
  ]
};
