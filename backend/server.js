const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

/**
 * Entry point: connect to MongoDB FIRST, then start listening — the server
 * intentionally never accepts HTTP traffic against a database it isn't
 * connected to.
 */
async function start() {
  try {
    await connectDB();
    // eslint-disable-next-line no-console
    console.log('[mongo] connected');

    const server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
    });

    process.on('unhandledRejection', (err) => {
      // eslint-disable-next-line no-console
      console.error('[unhandledRejection]', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
