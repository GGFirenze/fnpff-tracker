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
    try {
      const result = await db.execute('SELECT * FROM tickets ORDER BY id ASC')
      return res.status(200).json(result.rows)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    const data = req.body
    if (!data.topic) {
      return res.status(400).json({ error: 'Topic is required' })
    }

    try {
      const maxId = await db.execute('SELECT COALESCE(MAX(id), 0) as max_id FROM tickets')
      const newId = maxId.rows[0].max_id + 1

      await db.execute({
        sql: `INSERT INTO tickets (id, topic, summary, classification, fressnapf_status, amplitude_status, zendesk_ticket_id, zendesk_url, productboard_note_id, productboard_url, productboard_status, pm_owner, pillar, reporter, created_date, notes, engineering_ref, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          newId,
          data.topic,
          data.summary || '',
          data.classification || 'FR',
          data.fressnapf_status || 'Open',
          data.amplitude_status || 'Unprocessed',
          data.zendesk_ticket_id || null,
          data.zendesk_url || null,
          data.productboard_note_id || null,
          data.productboard_url || null,
          data.productboard_status || 'Not Logged',
          data.pm_owner || 'None',
          data.pillar || 'Governance',
          data.reporter || '',
          data.created_date || new Date().toISOString().split('T')[0],
          data.notes || null,
          data.engineering_ref || null,
        ],
      })

      const result = await db.execute({ sql: 'SELECT * FROM tickets WHERE id = ?', args: [newId] })
      return res.status(201).json(result.rows[0])
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PATCH') {
    const { id, updates } = req.body
    if (!id || !updates) {
      return res.status(400).json({ error: 'Missing id or updates' })
    }

    const allowedFields = ['topic', 'summary', 'classification', 'fressnapf_status', 'amplitude_status',
      'zendesk_ticket_id', 'zendesk_url', 'productboard_note_id', 'productboard_url',
      'productboard_status', 'pm_owner', 'pillar', 'reporter', 'notes', 'engineering_ref']

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f))
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

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

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) {
      return res.status(400).json({ error: 'Missing id' })
    }

    try {
      await db.execute({ sql: 'DELETE FROM audit_log WHERE ticket_id = ?', args: [id] })
      await db.execute({ sql: 'DELETE FROM tickets WHERE id = ?', args: [id] })
      return res.status(200).json({ ok: true })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
