const { pool } = require('../lib/db');
const { requireRole } = require('../lib/auth');

module.exports = async (req, res) => {
  const user = requireRole(req, res, ['editor', 'super_user']);
  if (!user) return;

  if (req.method === 'POST') {
    const b = req.body || {};
    const result = await pool.query(
      `insert into incidents (
        person_id, incident_date, incident_type, severity, description,
        proximity_category, on_shift, directly_involved, witnessed_scene,
        body_recovery, line_of_sight_only, multi_fatality, media_interest,
        colleague_involved, child_involved, created_by
      ) values (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,$13,
        $14,$15,$16
      ) returning *`,
      [
        b.person_id, b.incident_date, b.incident_type, b.severity, b.description || '',
        b.proximity_category || 'Indirect', !!b.on_shift, !!b.directly_involved, !!b.witnessed_scene,
        !!b.body_recovery, !!b.line_of_sight_only, !!b.multi_fatality, !!b.media_interest,
        !!b.colleague_involved, !!b.child_involved, user.sub
      ]
    );
    return res.json({ ok: true, item: result.rows[0] });
  }

  if (req.method === 'DELETE') {
    await pool.query('delete from incidents where id = $1', [req.query.id]);
    return res.json({ ok: true });
  }

  res.statusCode = 405;
  res.end('Method not allowed');
};
