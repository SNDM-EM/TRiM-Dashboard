const { pool } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

async function getRiskMap() {
  const matrix = await pool.query('select key, score_value, is_enabled from risk_matrix');
  const map = {};
  for (const row of matrix.rows) {
    map[row.key] = { value: Number(row.score_value || 0), enabled: !!row.is_enabled };
  }
  return map;
}

function computeIncidentScore(incident, risk) {
  let score = 0;
  const sevKey = `severity_${String(incident.severity || '').toLowerCase()}`;
  if (risk[sevKey]?.enabled) score += risk[sevKey].value;
  if (incident.on_shift && risk.on_shift?.enabled) score += risk.on_shift.value;
  if (incident.directly_involved && risk.directly_involved?.enabled) score += risk.directly_involved.value;
  if (incident.witnessed_scene && risk.witnessed_scene?.enabled) score += risk.witnessed_scene.value;
  if (incident.body_recovery && risk.body_recovery?.enabled) score += risk.body_recovery.value;
  if (incident.line_of_sight_only && risk.line_of_sight_only?.enabled) score += risk.line_of_sight_only.value;
  if (incident.multi_fatality && risk.multi_fatality?.enabled) score += risk.multi_fatality.value;
  if (incident.media_interest && risk.media_interest?.enabled) score += risk.media_interest.value;
  if (incident.colleague_involved && risk.colleague_involved?.enabled) score += risk.colleague_involved.value;
  if (incident.child_involved && risk.child_involved?.enabled) score += risk.child_involved.value;
  return score;
}

function repeatBonus(incidents, risk) {
  let bonus = 0;
  const sorted = [...incidents].sort((a, b) => new Date(a.incident_date) - new Date(b.incident_date));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const diff = Math.abs(new Date(sorted[j].incident_date) - new Date(sorted[i].incident_date)) / 86400000;
      if (diff <= 30 && risk.within_30_days?.enabled) bonus += risk.within_30_days.value;
      else if (diff <= 90 && risk.within_90_days?.enabled) bonus += risk.within_90_days.value;
    }
  }
  return bonus;
}

function rag(score) {
  if (score >= 20) return 'Red';
  if (score >= 10) return 'Amber';
  return 'Green';
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const showClosed = req.query.showClosed === 'true';
    const personnelResult = await pool.query(
      `select * from personnel ${showClosed ? '' : "where status = 'open'"} order by full_name asc`
    );
    const incidentsResult = await pool.query('select * from incidents order by incident_date desc nulls last, created_at desc');
    const risk = await getRiskMap();

    const items = personnelResult.rows.map(person => {
      const personIncidents = incidentsResult.rows.filter(i => i.person_id === person.id);
      const base = personIncidents.reduce((sum, i) => sum + computeIncidentScore(i, risk), 0);
      const total = base + repeatBonus(personIncidents, risk);
      return {
        ...person,
        risk_score: total,
        rag_status: rag(total + Number(person.individual_risk_override || 0)),
        total_incidents: personIncidents.length,
        last_incident_date: personIncidents[0]?.incident_date || null,
        incidents: personIncidents
      };
    });

    return res.json({ items });
  }

  if (req.method === 'POST') {
    const user = requireRole(req, res, ['editor', 'super_user']);
    if (!user) return;
    const { full_name, job_title, area, notes = '', individual_risk_override = 0 } = req.body || {};
    const result = await pool.query(
      `insert into personnel (full_name, job_title, area, notes, status, created_by, individual_risk_override)
       values ($1,$2,$3,$4,'open',$5,$6) returning *`,
      [full_name, job_title, area, notes, user.sub, individual_risk_override]
    );
    return res.json({ ok: true, item: result.rows[0] });
  }

  if (req.method === 'PATCH') {
    const user = requireRole(req, res, ['editor', 'super_user']);
    if (!user) return;
    const { id, notes, status, individual_risk_override } = req.body || {};
    const result = await pool.query(
      `update personnel
       set notes = coalesce($2, notes),
           status = coalesce($3, status),
           individual_risk_override = coalesce($4, individual_risk_override),
           updated_at = now()
       where id = $1
       returning *`,
      [id, notes ?? null, status ?? null, individual_risk_override ?? null]
    );
    return res.json({ ok: true, item: result.rows[0] });
  }

  res.statusCode = 405;
  res.end('Method not allowed');
};
