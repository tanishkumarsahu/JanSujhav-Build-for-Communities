'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

/**
 * Sign a JWT for the given payload.
 * @param {object} payload - e.g. { id, email, role }
 * @returns {string} signed token
 */
function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Verify a JWT and return the decoded payload.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {Error} if invalid
 */
function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

/**
 * Middleware: require a valid Bearer JWT.
 * Sets req.user = decoded payload, or returns 401.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired'
        : err.name === 'JsonWebTokenError'
        ? 'Invalid token'
        : 'Authentication failed';
    return res.status(401).json({ success: false, error: message });
  }
}

/**
 * Middleware: optionally parse a Bearer JWT.
 * If no token / invalid token → req.user = null, still calls next().
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        try {
          req.user = verifyToken(token);
        } catch (_) {
          req.user = null;
        }
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
  } catch (_) {
    req.user = null;
  }
  next();
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

/**
 * Verify a Google ID token and return the payload.
 * @param {string} idToken
 * @returns {Promise<{ sub, email, name, picture }>}
 */
async function verifyGoogleToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token — empty payload');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

/**
 * Hash a plain-text password with bcrypt (12 rounds).
 * @param {string} password
 * @returns {Promise<string>} hash
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  verifyGoogleToken,
  hashPassword,
  comparePassword,
};
