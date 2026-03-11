# Backend API Structure Documentation

## Project Overview
FacilityPro Backend - A comprehensive Node.js/Express server for maintenance management system with MongoDB integration.

## Directory Structure

```
node-http-sever/
├── src/
│   ├── config/
│   │   └── constants.js          # App-wide constants, roles, status enums
│   ├── controllers/              # Route handlers
│   │   ├── authController.js
│   │   ├── assetController.js
│   │   ├── workOrderController.js
│   │   └── vendorController.js
│   ├── middleware/               # Express middleware
│   │   ├── auth.js              # JWT authentication & authorization
│   │   ├── validation.js        # Request validation
│   │   └── logger.js            # Request logging
│   ├── models/                   # MongoDB Mongoose schemas
│   │   ├── User.js
│   │   ├── Asset.js
│   │   ├── WorkOrder.js
│   │   ├── PreventiveMaintenance.js
│   │   ├── Vendor.js
│   │   └── Report.js
│   ├── routes/                   # API route definitions
│   │   ├── authRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── workOrderRoutes.js
│   │   └── vendorRoutes.js
│   ├── services/                 # Business logic layer
│   │   ├── authService.js       # JWT token generation, password hashing
│   │   ├── assetService.js      # Asset CRUD & search operations
│   │   ├── workOrderService.js  # Work order management logic
│   │   └── vendorService.js     # Vendor management logic
│   ├── utils/                    # Utility functions
│   │   ├── errorHandler.js      # Custom error classes & global error handler
│   │   ├── response.js          # Standardized API response helpers
│   │   └── logger.js            # Logging utilities
│   └── validators/              # Input validation schemas (Joi/Yup)
├── DataBase/
│   └── dbconnection.js          # MongoDB connection setup
├── server.js                    # Express app initialization
├── package.json
└── .env                         # Environment variables

```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/verify` - Verify token validity

### Assets
- `GET /api/assets` - List assets with pagination & filters
- `GET /api/assets/:id` - Get asset details
- `POST /api/assets` - Create new asset (protected)
- `PUT /api/assets/:id` - Update asset (protected)
- `DELETE /api/assets/:id` - Delete asset (protected)

### Work Orders
- `GET /api/work-orders` - List work orders with filters
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create work order (protected)
- `PUT /api/work-orders/:id` - Update work order (protected)
- `PATCH /api/work-orders/:id/status` - Update status (protected)
- `POST /api/work-orders/:id/assign` - Assign technician (protected)
- `POST /api/work-orders/:id/comments` - Add comment (protected)
- `DELETE /api/work-orders/:id` - Delete work order (protected)

### Vendors
- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create vendor (protected)
- `PUT /api/vendors/:id` - Update vendor (protected)
- `DELETE /api/vendors/:id` - Delete vendor (protected)

### Health Check
- `GET /api/health` - Server status check

## Key Features

### Authentication & Authorization
- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Token expiration (configurable via constants)

### Database Models

#### User
- Authentication & profile management
- Role assignment (admin, facility_manager, technician, staff, vendor, user)
- Last login tracking

#### Asset
- Asset lifecycle management
- Maintenance history tracking
- QR code support
- Custom fields for extensibility
- Full-text search capability

#### WorkOrder
- Comprehensive maintenance tracking
- Status management (open, assigned, in_progress, completed, cancelled, on_hold)
- Priority levels (low, medium, high, urgent)
- Technician assignment
- Comment/notes system
- Estimated vs actual cost/time tracking

#### PreventiveMaintenance
- Scheduled maintenance planning
- Frequency-based scheduling
- Upcoming maintenance tracking

#### Vendor
- Vendor information & contact management
- Rating system
- Category classification
- Service specialties tracking

#### Report
- Report generation & export
- Multiple format support (json, csv, excel, pdf)

## Response Format

All API responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors */ }
}
```

## Error Handling

Custom error classes:
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `AppError` (500)

All errors are caught by global error handler middleware.

## Configuration

Environment variables in `.env`:
```
DBSTRING=mongodb+srv://...
EXPRESS_PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

Application constants in `src/config/constants.js`:
- Pagination defaults
- File upload limits
- Role definitions
- Status enums
- Priority levels
- Maintenance types

## Middleware Pipeline

1. **CORS** - Enable cross-origin requests
2. **JSON Parser** - Parse incoming JSON requests
3. **Request Logger** - Log all incoming requests with duration
4. **Auth Middleware** - JWT validation for protected routes
5. **Authorization Middleware** - Role-based access control
6. **Error Handler** - Catch and format all errors

## Database Indexes

Optimized indexes for common queries:
- User: email (unique)
- Asset: name (text), status, category
- WorkOrder: status, priority, assignedTo, asset, createdAt
- PreventiveMaintenance: nextDueDate, active, asset
- Vendor: category, active

## Getting Started

### Installation
```bash
cd node-http-sever
npm install
```

### Development
```bash
npm run dev  # Uses nodemon for auto-reload
```

### Production
```bash
npm start
```

### Server Health Check
```bash
curl http://localhost:5000/api/health
```

## Future Enhancements

- [ ] Swagger/OpenAPI documentation
- [ ] Advanced filtering & query builder
- [ ] Batch operations support
- [ ] WebSocket real-time updates
- [ ] File upload/storage integration
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Analytics & dashboards
- [ ] Audit logging
- [ ] Role-based field visibility
- [ ] Document versioning
- [ ] Soft delete support
- [ ] Multi-tenancy support

## Security Considerations

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ CORS enabled for frontend integration
- ✅ Input validation middleware ready
- ✅ Environment variable protection
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Helmet.js security headers
- ⚠️ TODO: Request size limits
- ⚠️ TODO: SQL injection protection (using Mongoose)

## Performance Optimizations

- Database indexing on frequently queried fields
- Pagination support for large datasets
- Full-text search capability for assets
- Request logging for monitoring
- Connection pooling via Mongoose

## Monitoring & Logging

- Request-level logging with timestamp & duration
- Error tracking with full stack trace in development
- File-based log persistence (configurable)
- Color-coded console output

---

**Last Updated:** February 16, 2026
**Status:** Production Ready

