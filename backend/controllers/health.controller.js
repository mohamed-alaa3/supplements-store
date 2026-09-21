const mongoose = require('mongoose');

// GET /api/health
function getHealth(req, res) {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      database: states[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { getHealth };
