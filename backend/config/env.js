require('dotenv').config();

/**
 * Single place that reads process.env so the rest of the app never touches
 * process.env directly. Fails fast if a required variable is missing.
 */
const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 5,
  emailHost: process.env.EMAIL_HOST || '',
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@supplements-store.com',
  // See README "Known gap: shipping-fee policy" — the brief doesn't specify
  // an exact algorithm, so this flat/threshold policy is isolated here.
  flatShippingFee: Number(process.env.FLAT_SHIPPING_FEE) || 50,
  freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD) || 1500,
  isProduction: process.env.NODE_ENV === 'production'
};
