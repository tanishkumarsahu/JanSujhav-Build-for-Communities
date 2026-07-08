'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const {
  generateToken,
  authMiddleware,
  verifyGoogleToken,
  hashPassword,
  comparePassword,
} = require('../auth');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ROLES = ['citizen', 'mp', 'admin'];

/**
 * Return a user object safe to send to the client (no password_hash).
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'A valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    const assignedRole = role && VALID_ROLES.includes(role) ? role : 'citizen';

    // Check existing user
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, assignedRole]
    );

    const user = rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      data: { token, user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[Auth] /register error:', err.message);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = rows[0];

    if (!user.password_hash) {
      // Google-only account
      return res.status(401).json({ success: false, error: 'This account uses Google sign-in. Please use Google to login.' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      data: { token, user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[Auth] /login error:', err.message);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------
router.post('/google', async (req, res) => {
  try {
    const tokenPayload = req.body.idToken || req.body.credential;

    if (!tokenPayload || typeof tokenPayload !== 'string' || tokenPayload.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Google ID token or credential is required' });
    }

    let googlePayload;
    try {
      googlePayload = await verifyGoogleToken(tokenPayload.trim());
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired Google token' });
    }

    const { sub: googleId, email, name } = googlePayload;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google account has no email address' });
    }

    // Try to find existing user by google_id first, then by email
    let { rows } = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    if (rows.length === 0) {
      // Try by email (merge existing account)
      const byEmail = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (byEmail.rows.length > 0) {
        // Link google_id to existing account
        const updated = await query(
          'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
          [googleId, byEmail.rows[0].id]
        );
        rows = updated.rows;
      } else {
        // Create new user
        const created = await query(
          `INSERT INTO users (name, email, google_id, role)
           VALUES ($1, $2, $3, 'citizen')
           RETURNING *`,
          [name || email.split('@')[0], email.toLowerCase(), googleId]
        );
        rows = created.rows;
      }
    }

    const user = rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      data: { token, user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[Auth] /google error:', err.message);
    return res.status(500).json({ success: false, error: 'Google authentication failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: { user: sanitizeUser(rows[0]) },
    });
  } catch (err) {
    console.error('[Auth] /me error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/auth/me/constituency
// ---------------------------------------------------------------------------
router.put('/me/constituency', authMiddleware, async (req, res) => {
  try {
    const { constituency } = req.body;

    if (!constituency || typeof constituency !== 'string' || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Constituency name is required' });
    }

    const { rows } = await query(
      'UPDATE users SET constituency = $1 WHERE id = $2 RETURNING *',
      [constituency.trim(), req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: { user: sanitizeUser(rows[0]) },
    });
  } catch (err) {
    console.error('[Auth] /me/constituency error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update constituency' });
  }
});

module.exports = router;
