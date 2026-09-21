const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connects to MongoDB via Mongoose. Called once from server.js before the
 * HTTP server starts listening, so the app never serves requests against a
 * dead database connection.
 *
 * NOTE (sandbox limitation): this function has been code-reviewed but not
 * executed against a live MongoDB instance in the build environment, which
 * has no network access and no local mongod. Run `npm run dev` locally with
 * a real MONGO_URI (local mongod or MongoDB Atlas) to exercise this path.
 */
async function connectDB() {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    // Mongoose 8 / MongoDB driver 6 no longer need useNewUrlParser / useUnifiedTopology.
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mongo] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[mongo] disconnected');
  });

  return conn;
}

module.exports = connectDB;
