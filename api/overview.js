const { pool } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  const openP = await pool.query("select count(*)::int as c from personnel where status = 'open'");
  const closedP = await pool.query("select count(*)::int as c from personnel where status = 'closed'");
  const incidents = await pool.query("select count(*)::int as c from incidents");
  const breakdown = await pool.query(
    'select incident_type, count(*)::int as count from incidents group by incident_type order by count desc, incident_type asc'
  );
  return res.json({
    total_personnel_open: openP.rows[0].c,
    total_personnel_closed: closedP.rows[0].c,
    total_incidents: incidents.rows[0].c,
    incident_breakdown: breakdown.rows
  });
};
