const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const env = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimit');

/**
 * Express app assembly, separated from server.js so it can be imported by
 * tests without binding a port.
 */
const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
// Required middleware (brief §6 "logger"): log method/path/status/duration.
// 'dev' is colorized/concise for local work; 'combined' is the standard
// Apache-style line, better for redirecting to a log file in production.
// Neither format logs headers or the body, so secrets/JWTs are never logged.
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.resolve(__dirname, env.uploadDir)));

app.use('/api', apiLimiter, apiRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'Supplements Store API', docs: '/api/health' } });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
