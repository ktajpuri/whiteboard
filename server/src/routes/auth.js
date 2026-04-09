const router = require('express').Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const authMiddleware = require('../middleware/auth')

function issueToken(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
  return token
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length) return res.status(409).json({ error: 'Email already in use' })
    const hash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, avatar_url',
      [email, hash, displayName || email.split('@')[0]]
    )
    issueToken(res, rows[0])
    res.json({ user: rows[0] })
  } catch (err) { next(err) }
})

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err)
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' })
    issueToken(res, user)
    res.json({ user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } })
  })(req, res, next)
})

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'], session: false }))

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}?error=oauth` }),
  (req, res) => {
    issueToken(res, req.user)
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173')
  }
)

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  })
  res.json({ ok: true })
})

// Me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json({ user: rows[0] })
  } catch (err) { next(err) }
})

module.exports = router
