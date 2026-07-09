import { getDb, authCheck, unauthorized } from './_db.js'

export default async function handler(req, res) {
  if (!authCheck(req)) return unauthorized(res)

  let db
  try {
    db = getDb()
  } catch (error) {
    return res.status(500).json({ error: `DB init failed: ${error.message}` })
  }

  if (req.method === 'GET') {
    const limit = parseInt(req.query.limit) || 50
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT ?',
        args: [limit],
      })
      return res.status(200).json(result.rows)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    const { ticket_id, field_changed, old_value, new_value, changed_by } = req.body
    if (!ticket_id || !field_changed) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    try {
      await db.execute({
        sql: `INSERT INTO audit_log (ticket_id, field_changed, old_value, new_value, changed_by, changed_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [ticket_id, field_changed, old_value || '', new_value || '', changed_by || 'user'],
      })
      return res.status(201).json({ ok: true })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
