const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const bcrypt = require('bcryptjs')
const { pool } = require('../db')

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user || !user.password_hash) return done(null, false, { message: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return done(null, false, { message: 'Invalid credentials' })
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3001'}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE google_id = $1 OR email = $2',
        [profile.id, email]
      )
      let user = rows[0]
      if (user) {
        if (!user.google_id) {
          await pool.query(
            'UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
            [profile.id, profile.photos[0]?.value, user.id]
          )
        }
        return done(null, user)
      }
      const { rows: newRows } = await pool.query(
        'INSERT INTO users (email, google_id, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, profile.id, profile.displayName, profile.photos[0]?.value]
      )
      return done(null, newRows[0])
    } catch (err) {
      return done(err)
    }
  }
))
