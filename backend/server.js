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

const EXPRESSPORT = constants.PORT;
const app = express();


// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true
  })
);

//  Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Static files → normal caching, 304 is fine
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/preventive-maintenance', preventiveMaintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/finance', financeRoutes);

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
    logger.info(`API Documentation: http://localhost:${EXPRESSPORT}/api/docs`);
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
