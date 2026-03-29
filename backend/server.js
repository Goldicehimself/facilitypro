require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./DataBase/dbconnection.js');

// Import configuration and middleware
const logger = require('./src/utils/logger');
const { requestLogger } = require('./src/middleware/logger');
const { protect } = require('./src/middleware/auth');
const { AuthorizationError } = require('./src/utils/errorHandler');
const constants = require('./src/constants/constants');
const { errorHandler } = require('./src/utils/errorHandler');
const webhookService = require('./src/services/webhookService');
const workOrderService = require('./src/services/workOrderService');
const preventiveMaintenanceService = require('./src/services/preventiveMaintenanceService');
const { initRedis, closeRedis } = require('./src/utils/redisClient');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const workOrderRoutes = require('./src/routes/workOrderRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const preventiveMaintenanceRoutes = require('./src/routes/preventiveMaintenanceRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const orgRoutes = require('./src/routes/orgRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const fundRoutes = require('./src/routes/fundRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const serviceRequestRoutes = require('./src/routes/serviceRequestRoutes');
const financeRoutes = require('./src/routes/financeRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
const superAdminRoutes = require('./src/routes/superAdminRoutes');

const EXPRESSPORT = constants.PORT;
const app = express();


// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [])
]
  .map((origin) => String(origin || '').trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins.length) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

//  Body parsing
app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith('/api/v1/billing/webhook')) return next();
  return express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl?.startsWith('/api/v1/billing/webhook')) return next();
  return express.urlencoded({ extended: true })(req, res, next);
});

// IMPORTANT for Render / proxies
app.set("trust proxy", 1);

//  Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // adjust based on your needs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

app.use(limiter);

//  Request logging
app.use(requestLogger);

// Dynamic APIs → never cache
app.use('/api/v1', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Static files → normal caching, 304 is fine
app.use(express.static('public'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/work-orders', workOrderRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/preventive-maintenance', preventiveMaintenanceRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/org', orgRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/funds', fundRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/service-requests', serviceRequestRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use(errorHandler);


const startServer = async () => {
  // Connect DB first so background jobs don't run before Mongo is ready
  await connectDB();

  // Connect Redis (if REDIS_URL is configured)
  await initRedis().catch((err) => {
    logger.warn('[redis] init failed', err?.message || err);
  });

  // Leave reminder job (every 6 hours)
  const { sendLeaveReminderEmails } = require('./src/services/leaveService');
  setInterval(() => {
    sendLeaveReminderEmails().catch((err) => logger.error('[leave reminders] failed', err?.message || err));
  }, 6 * 60 * 60 * 1000);

  // Overdue work orders & PM due webhook jobs (every 60 minutes)
  const runWebhookJobs = async () => {
    try {
      const overdueWorkOrders = await workOrderService.getOverdueWorkOrders();
      if (overdueWorkOrders.length) {
        overdueWorkOrders.forEach((wo) => {
          webhookService.emitWebhookEvent(wo.organization?.toString?.() || wo.organization, 'workorder.overdue', { workOrder: wo });
        });
        await workOrderService.markOverdueNotified(overdueWorkOrders.map((wo) => wo._id));
      }

      const dueMaintenances = await preventiveMaintenanceService.getDueMaintenances();
      if (dueMaintenances.length) {
        dueMaintenances.forEach((pm) => {
          webhookService.emitWebhookEvent(pm.organization?.toString?.() || pm.organization, 'pm.due', { maintenance: pm });
        });
        await preventiveMaintenanceService.markDueNotified(dueMaintenances.map((pm) => pm._id));
      }
    } catch (error) {
      logger.error('[webhook jobs] failed', error?.message || error);
    }
  };

  setInterval(runWebhookJobs, 60 * 60 * 1000);
  runWebhookJobs();

  const server = app.listen(EXPRESSPORT, () => {
    logger.info(`Server is running on http://localhost:${EXPRESSPORT}`);
    logger.info(`API Documentation: http://localhost:${EXPRESSPORT}/api/v1/docs`);
    logger.info(`EMAIL_BASE_URL: ${process.env.EMAIL_BASE_URL || '(not set)'}`);
    logger.info(`FRONTEND_URL: ${process.env.FRONTEND_URL || '(not set)'}`);
  });

  const shutdown = (signal) => {
    logger.info(`[shutdown] ${signal} received, closing resources`);
    server.close(async () => {
      await closeRedis();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  logger.error('[startup] failed', err?.message || err);
});
