import { SEED_TICKETS } from './data'

function getToken() {
  return sessionStorage.getItem('fressnapf-token') || ''
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function verifyPassword(password) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getTickets() {
  try {
    return await apiFetch('tickets')
  } catch {
    return SEED_TICKETS
  }
}

export async function updateTicket(id, updates) {
  try {
    return { data: await apiFetch('tickets', {
      method: 'PATCH',
      body: JSON.stringify({ id, updates }),
    })}
  } catch (error) {
    return { error: error.message }
  }
}

export async function logAuditEntry({ ticket_id, field_changed, old_value, new_value, changed_by }) {
  try {
    await apiFetch('audit', {
      method: 'POST',
      body: JSON.stringify({ ticket_id, field_changed, old_value, new_value, changed_by }),
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

export async function getAuditLog(limit = 50) {
  try {
    return await apiFetch(`audit?limit=${limit}`)
  } catch {
    return []
  }
}

export async function seedDatabase() {
  try {
    return await apiFetch('seed', { method: 'POST' })
  } catch (error) {
    return { error: error.message }
  }
}
