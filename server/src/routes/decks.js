const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')

router.get('/', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM decks WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id])
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', auth, async (req, res, next) => {
  try {
    const { title = 'Untitled' } = req.body
    const { rows } = await pool.query(
      'INSERT INTO decks (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, title]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.get('/:deckId', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [req.params.deckId, req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'Deck not found' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.patch('/:deckId', auth, async (req, res, next) => {
  try {
    const { title } = req.body
    const { rows } = await pool.query(
      'UPDATE decks SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [title, req.params.deckId, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Deck not found' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.delete('/:deckId', auth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM decks WHERE id = $1 AND user_id = $2', [req.params.deckId, req.user.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
