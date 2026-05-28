import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Filters from './components/Filters'
import TicketTable from './components/TicketTable'
import ExportButton from './components/ExportButton'
import AuditLog from './components/AuditLog'
import { getTickets, updateTicket, logAuditEntry } from './lib/api'
import { SEED_TICKETS } from './lib/data'

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('fressnapf-auth') === 'true')
  const [tickets, setTickets] = useState(SEED_TICKETS)
  const [filters, setFilters] = useState({ status: [], classification: [], pillar: [], pbStatus: [] })
  const [loading, setLoading] = useState(true)
  const [auditRefresh, setAuditRefresh] = useState(0)

  useEffect(() => {
    if (authed) {
      setLoading(true)
      getTickets().then(data => {
        setTickets(data)
        setLoading(false)
      })
    }
  }, [authed])

  const handleUpdate = useCallback(async (id, field, newValue, oldValue) => {
    setTickets(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: newValue, last_updated: new Date().toISOString() } : t
    ))

    await updateTicket(id, { [field]: newValue })
    await logAuditEntry({
      ticket_id: id,
      field_changed: field,
      old_value: oldValue || '',
      new_value: newValue,
      changed_by: 'user',
    })
    setAuditRefresh(prev => prev + 1)
  }, [])

  const filteredTickets = tickets.filter(t => {
    if (filters.status.length && !filters.status.includes(t.fressnapf_status)) return false
    if (filters.classification.length && !filters.classification.includes(t.classification)) return false
    if (filters.pillar.length && !filters.pillar.includes(t.pillar)) return false
    if (filters.pbStatus.length && !filters.pbStatus.includes(t.productboard_status)) return false
    return true
  })

  if (!authed) return <Login onAuth={setAuthed} />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fressnapf Support Tracker</h1>
            <p className="text-sm text-gray-500">Shared issue visibility — Amplitude & Fressnapf</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton tickets={filteredTickets} />
            <button
              onClick={() => { sessionStorage.removeItem('fressnapf-auth'); setAuthed(false) }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading tickets...</div>
        ) : (
          <>
            <Dashboard tickets={tickets} />
            <Filters filters={filters} setFilters={setFilters} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </span>
            </div>
            <TicketTable tickets={filteredTickets} onUpdate={handleUpdate} />
            <AuditLog refreshTrigger={auditRefresh} />
          </>
        )}
      </main>
    </div>
  )
}
