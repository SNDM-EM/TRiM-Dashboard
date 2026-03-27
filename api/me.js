const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  res.json({ user });
};
