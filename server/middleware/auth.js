// Simple and robust Admin authentication middleware
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET || 'eventflow_admin_secret_token_2026';

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.headers['x-admin-token'];

  if (!token || token !== ADMIN_SECRET_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Please login as admin.'
    });
  }

  next();
}

module.exports = {
  adminAuth,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  ADMIN_SECRET_TOKEN
};
