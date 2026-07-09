// Use the fetch-based web client: it has no native dependencies, which is the
// supported way to talk to a remote Turso DB from Vercel serverless functions.
// The default '@libsql/client' entry pulls in a native addon that fails to load
// in the Lambda runtime and crashes the function with FUNCTION_INVOCATION_FAILED.
import { createClient } from '@libsql/client/web'

let db = null

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) {
    throw new Error(
      `Turso env vars missing: ${!url ? 'TURSO_DATABASE_URL ' : ''}${!authToken ? 'TURSO_AUTH_TOKEN' : ''}`.trim(),
    )
  }
  if (!db) {
    db = createClient({ url, authToken })
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
