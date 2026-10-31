import crypto from 'node:crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function checkPassword(password, { salt, hash }) {
  if (typeof password !== 'string') return false;
  const attempt = Buffer.from(hashPassword(password, salt).hash, 'hex');
  return crypto.timingSafeEqual(attempt, Buffer.from(hash, 'hex'));
}

const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

export function makeToken(username, secret) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

// Returns the username for a valid token, otherwise null
export function verifyToken(token, secret) {
  const [payload, sig] = (token || '').split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload, secret);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp > Date.now() ? u : null;
  } catch {
    return null;
  }
}
