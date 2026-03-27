const { clearAuthCookie } = require('../lib/auth');

module.exports = async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};
