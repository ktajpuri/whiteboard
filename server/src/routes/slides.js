const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')

async function ownsDeck(deckId, userId) {
  const { rows } = await pool.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [deckId, userId])
  return rows.length > 0
}

router.get('/:deckId/slides', auth, async (req, res, next) => {
  try {
    if (!await ownsDeck(req.params.deckId, req.user.id)) return res.status(404).json({ error: 'Deck not found' })
    const { rows } = await pool.query('SELECT * FROM slides WHERE deck_id = $1 ORDER BY order_index', [req.params.deckId])
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/:deckId/slides', auth, async (req, res, next) => {
  try {
    if (!await ownsDeck(req.params.deckId, req.user.id)) return res.status(404).json({ error: 'Deck not found' })
    const { label = 'Slide', elements = [] } = req.body
    const { rows: maxRow } = await pool.query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM slides WHERE deck_id = $1',
      [req.params.deckId]
    )
    const { rows } = await pool.query(
      'INSERT INTO slides (deck_id, order_index, label, elements) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.deckId, maxRow[0].next, label, JSON.stringify(elements)]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/:deckId/slides/:slideId', auth, async (req, res, next) => {
  try {
    if (!await ownsDeck(req.params.deckId, req.user.id)) return res.status(404).json({ error: 'Deck not found' })
    const { label, elements, order_index } = req.body
    const { rows } = await pool.query(
      `UPDATE slides SET
        label = COALESCE($1, label),
        elements = COALESCE($2, elements),
        order_index = COALESCE($3, order_index),
        updated_at = NOW()
       WHERE id = $4 AND deck_id = $5 RETURNING *`,
      [label ?? null, elements != null ? JSON.stringify(elements) : null, order_index ?? null, req.params.slideId, req.params.deckId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Slide not found' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.delete('/:deckId/slides/:slideId', auth, async (req, res, next) => {
  try {
    if (!await ownsDeck(req.params.deckId, req.user.id)) return res.status(404).json({ error: 'Deck not found' })
    await pool.query('DELETE FROM slides WHERE id = $1 AND deck_id = $2', [req.params.slideId, req.params.deckId])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.post('/:deckId/slides/reorder', auth, async (req, res, next) => {
  try {
    if (!await ownsDeck(req.params.deckId, req.user.id)) return res.status(404).json({ error: 'Deck not found' })
    const { order } = req.body // [{ id, order_index }]
    await Promise.all(order.map(({ id, order_index }) =>
      pool.query('UPDATE slides SET order_index = $1 WHERE id = $2 AND deck_id = $3', [order_index, id, req.params.deckId])
    ))
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
