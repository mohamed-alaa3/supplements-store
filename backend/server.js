
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

/**
 * Entry point: connect to MongoDB FIRST, then start listening.
 */
async function start() {
  try {
    await connectDB();

    // eslint-disable-next-line no-console
    console.log('[mongo] connected');

    const server = app.listen(env.port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(
        `[server] listening on 0.0.0.0:${env.port} (${env.nodeEnv})`
      );
    });

    const shutdown = (signal) => {
      // eslint-disable-next-line no-console
      console.log(`[shutdown] received ${signal}`);

      server.close(() => {
        // eslint-disable-next-line no-console
        console.log('[shutdown] HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error('[shutdown] forced exit after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      // eslint-disable-next-line no-console
      console.error('[unhandledRejection]', err);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      // eslint-disable-next-line no-console
      console.error('[uncaughtException]', err);

      server.close(() => {
        process.exit(1);
      });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[startup] failed to connect to MongoDB:',
      err.message
    );
    process.exit(1);
  }
}

start();

