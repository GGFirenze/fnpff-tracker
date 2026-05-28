import { createClient } from '@libsql/client'

let db = null

export function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return db
}

export function authCheck(req) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.replace('Bearer ', '')
  return token === process.env.APP_PASSWORD
}

export function unauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' })
}
