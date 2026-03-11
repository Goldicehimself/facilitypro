# FacilityPro Backend - Quick API Reference

## Server Information
- **Base URL**: `http://localhost:5000/api`
- **Status**: Running with nodemon (auto-reload enabled)
- **Database**: MongoDB (connected via Mongoose)

## Quick Start Examples

### 1. Authentication

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response includes:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2. Assets

#### List Assets
```bash
curl "http://localhost:5000/api/assets?page=1&limit=20&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Asset (Protected)
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Pump Unit A",
    "assetNumber": "PUMP-001",
    "description": "Industrial centrifugal pump",
    "category": "Equipment",
    "location": "Building A, Floor 2",
    "serialNumber": "SN-12345",
    "manufacturer": "ABC Industries"
  }'
```

#### Get Asset
```bash
curl http://localhost:5000/api/assets/ASSET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Asset
```bash
curl -X PUT http://localhost:5000/api/assets/ASSET_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "maintenance",
    "condition": "fair"
  }'
```

#### Delete Asset
```bash
curl -X DELETE http://localhost:5000/api/assets/ASSET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Work Orders

#### List Work Orders
```bash
curl "http://localhost:5000/api/work-orders?status=open&priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Work Order
```bash
curl -X POST http://localhost:5000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Emergency Pump Repair",
    "description": "Pump making unusual noise, needs immediate inspection",
    "asset": "ASSET_ID",
    "priority": "urgent",
    "maintenanceType": "corrective",
    "dueDate": "2026-02-17T10:00:00Z",
    "location": "Building A"
  }'
```

#### Update Work Order Status
```bash
curl -X PATCH http://localhost:5000/api/work-orders/WO_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "in_progress",
    "notes": "Started diagnosis"
  }'
```

#### Assign Work Order
```bash
curl -X POST http://localhost:5000/api/work-orders/WO_ID/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assigneeId": "TECHNICIAN_ID"
  }'
```

#### Add Comment
```bash
curl -X POST http://localhost:5000/api/work-orders/WO_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "comment": "Waiting for spare parts"
  }'
```

### 4. Vendors

#### List Vendors
```bash
curl "http://localhost:5000/api/vendors?category=supplier&active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Vendor
```bash
curl -X POST http://localhost:5000/api/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "ABC Industrial Supplies",
    "contactPerson": "Mike Johnson",
    "email": "contact@abc.com",
    "phone": "555-1234",
    "category": "Equipment Supplier",
    "specialties": ["pumps", "motors", "valves"]
  }'
```

### 5. Organization Settings

#### Get Organization Settings (Protected)
```bash
curl http://localhost:5000/api/org/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Organization Settings (Protected)
```bash
curl -X PUT http://localhost:5000/api/org/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "securityPolicy": {
      "enforceMfa": true,
      "sessionTimeoutMinutes": 120,
      "restrictInviteDomains": true,
      "allowedInviteDomains": ["company.com", "partner.org"]
    },
    "notifications": {
      "notifyWoCreated": true,
      "notifyWoOverdue": true,
      "quietHoursEnabled": true,
      "quietHoursStart": "22:00",
      "quietHoursEnd": "06:00"
    },
    "companyProfile": {
      "companyName": "Acme Facilities",
      "logoUrl": "https://example.com/logo.png",
      "contactEmail": "contact@acme.com"
    }
  }'
```

#### Public Security Policy (Register Flow)
```bash
curl "http://localhost:5000/api/org/public-security-policy?orgCode=ABC12345"
```

#### Verify Organization Email (Public)
```bash
curl "http://localhost:5000/api/org/verify-email?token=EMAIL_VERIFICATION_TOKEN"
```

### 6. Integrations (Tenant-level)

#### List Integrations (Protected)
```bash
curl http://localhost:5000/api/org/integrations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Webhook (Protected)
```bash
curl -X POST http://localhost:5000/api/org/integrations/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Work Order Events",
    "url": "https://example.com/webhooks/work-orders",
    "events": ["workorder.created", "workorder.assigned"],
    "active": true
  }'
```

#### Delete Webhook (Protected)
```bash
curl -X DELETE http://localhost:5000/api/org/integrations/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create API Key (Protected)
```bash
curl -X POST http://localhost:5000/api/org/integrations/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Zapier Connector",
    "scopes": ["workorders:read", "assets:read"],
    "expiresAt": "2026-12-31T00:00:00.000Z",
    "rateLimit": { "windowMs": 60000, "max": 60 }
  }'
```

#### Revoke API Key (Protected)
```bash
curl -X DELETE http://localhost:5000/api/org/integrations/api-keys/API_KEY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Webhook Events (MVP)
- `workorder.created`
- `workorder.assigned`
- `workorder.status_changed`
- `workorder.overdue`
- `pm.due`

#### Webhook Signing
Each webhook request includes:
- `x-maintainpro-event`
- `x-maintainpro-timestamp`
- `x-maintainpro-signature` = `sha256=HMAC(secret, "{timestamp}.{payload}")`

#### API Key Usage
Send API keys via:
```
x-api-key: mp_xxxxx
```

Supported scopes:
- `workorders:read`, `workorders:write`
- `assets:read`, `assets:write`
- `vendors:read`
- `reports:read`

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate email, etc. |
| 500 | Server Error | Unexpected error |

## Common Filters & Parameters

### Pagination
- `page` (default: 1)
- `limit` (default: 20, max: 100)

### Asset Filters
- `status`: active, inactive, maintenance, retired
- `category`: any category name
- `search`: full-text search on name, description, assetNumber

### Work Order Filters
- `status`: open, assigned, in_progress, completed, cancelled, on_hold
- `priority`: low, medium, high, urgent
- `assignedTo`: technician ID

### Vendor Filters
- `category`: vendor category
- `active`: true/false

## Authentication Header Format

All protected endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token validity: 7 days (configurable)

## File Structure for Development

```
src/
├── config/          # Constants & configuration
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Database schemas
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utilities & helpers
└── validators/     # Input validation (TODO)
```

## Troubleshooting

### Common Errors

**"Token is invalid or expired"**
- Get a new token via login
- Ensure token is passed in Authorization header

**"Asset not found"**
- Verify the asset ID is correct
- Check if asset was deleted

**"Email already registered"**
- Use a unique email for registration
- Or login with existing account

**"Insufficient permissions"**
- Ensure user has correct role
- Some endpoints may require admin/facility_manager role

## Next Steps

1. **Add more models** as needed:
   - Maintenance Plans
   - Service Contracts
   - Parts Inventory
   - Cost Centers

2. **Implement validators** for input validation:
   - Create Joi/Yup schemas
   - Add to middleware

3. **Add Swagger documentation**:
   - Install swagger-ui-express & swagger-jsdoc
   - Generate API docs

4. **Implement additional features**:
   - File upload for asset images
   - Email notifications
   - Advanced reporting
   - Analytics endpoints

5. **Security enhancements**:
   - Add rate limiting
   - Add helmet.js
   - Implement refresh tokens
   - Add audit logging

---

**API Version**: 1.0.0
**Last Updated**: February 20, 2026

