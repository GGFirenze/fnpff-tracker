import { getDb, authCheck, unauthorized } from './_db.js'

export default async function handler(req, res) {
  if (!authCheck(req)) return unauthorized(res)

  const db = getDb()

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM tickets ORDER BY id ASC')
      return res.status(200).json(result.rows)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PATCH') {
    const { id, updates } = req.body
    if (!id || !updates) {
      return res.status(400).json({ error: 'Missing id or updates' })
    }

    const fields = Object.keys(updates)
    const setClauses = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => updates[f])

    try {
      await db.execute({
        sql: `UPDATE tickets SET ${setClauses}, last_updated = datetime('now') WHERE id = ?`,
        args: [...values, id],
      })
      const result = await db.execute({ sql: 'SELECT * FROM tickets WHERE id = ?', args: [id] })
      return res.status(200).json(result.rows[0])
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
