// Activity Service (SSE)
const clients = new Set();
const Activity = require('../models/Activity');

const addClient = (res) => {
  clients.add(res);
};

const removeClient = (res) => {
  clients.delete(res);
};

const MAX_ACTIVITY_PER_ORG = 500;

const enforceRetention = async (organizationId) => {
  const overflow = await Activity.find({ organization: organizationId })
    .sort({ createdAt: -1 })
    .skip(MAX_ACTIVITY_PER_ORG)
    .select('_id')
    .lean();
  if (overflow.length) {
    await Activity.deleteMany({ _id: { $in: overflow.map((doc) => doc._id) } });
  }
};

const broadcast = (event) => {
  const data = `event: activity\ndata: ${JSON.stringify(event)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(data);
    } catch (error) {
      clients.delete(client);
    }
  });

  if (event?.organization) {
    Activity.create({
      organization: event.organization,
      type: event.type,
      action: event.action,
      title: event.title || event.message,
      description: event.description || event.entityType,
      user: event.user,
      status: event.status || null,
      entityType: event.entityType,
      entityId: event.entityId,
      link: event.link,
      createdAt: event.createdAt || new Date()
    }).then(() => {
      enforceRetention(event.organization).catch(() => {});
    }).catch(() => {});
  }
};

module.exports = {
  addClient,
  removeClient,
  broadcast
};
