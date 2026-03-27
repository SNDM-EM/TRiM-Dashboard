const bcrypt = require('bcryptjs');
const { pool } = require('../lib/db');
const { issueToken, setAuthCookie } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  try {
    const { username, password } = req.body || {};
    const result = await pool.query(
      'select id, username, display_name, password_hash, role, is_active from app_users where username = $1 limit 1',
      [username]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      res.statusCode = 401;
      return res.json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.statusCode = 401;
      return res.json({ error: 'Invalid credentials' });
    }
    setAuthCookie(res, issueToken(user));
    return res.json({ ok: true });
  } catch (error) {
    res.statusCode = 500;
    return res.json({ error: error.message });
  }
};
