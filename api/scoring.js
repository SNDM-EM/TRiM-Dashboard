const { pool } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const result = await pool.query('select key, label, score_value, is_enabled, sort_order from risk_matrix order by sort_order asc, label asc');
    return res.json({ items: result.rows });
  }

  if (req.method === 'PUT') {
    const user = requireRole(req, res, ['super_user']);
    if (!user) return;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    for (const item of items) {
      await pool.query(
        'update risk_matrix set score_value = $2, is_enabled = $3, updated_at = now() where key = $1',
        [item.key, Number(item.score_value || 0), !!item.is_enabled]
      );
    }
    return res.json({ ok: true });
  }

  res.statusCode = 405;
  res.end('Method not allowed');
};
