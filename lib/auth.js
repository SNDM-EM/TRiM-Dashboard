const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const COOKIE_NAME = 'trim_session';

function secret() {
  return process.env.JWT_SECRET || 'change-me';
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, display_name: user.display_name },
    secret(),
    { expiresIn: '12h' }
  );
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 12
  }));
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0
  }));
}

function readUser(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const user = readUser(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not authenticated' }));
    return null;
  }
  return user;
}

function requireRole(req, res, roles) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Insufficient permissions' }));
    return null;
  }
  return user;
}

module.exports = { issueToken, setAuthCookie, clearAuthCookie, readUser, requireAuth, requireRole };
