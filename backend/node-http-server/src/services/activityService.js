// Activity Service (SSE)
const clients = new Set();

const addClient = (res) => {
  clients.add(res);
};

const removeClient = (res) => {
  clients.delete(res);
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
};

module.exports = {
  addClient,
  removeClient,
  broadcast
};
