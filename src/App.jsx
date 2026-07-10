import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login'
import TopPriorities from './components/TopPriorities'
import Filters from './components/Filters'
import TicketTable from './components/TicketTable'
import ExportButton from './components/ExportButton'
import AuditLog from './components/AuditLog'
import AddTicketForm from './components/AddTicketForm'
import { getTickets, updateTicket, logAuditEntry, createTicket, deleteTicket } from './lib/api'
import { track } from './lib/analytics'
import { SEED_TICKETS, MAX_P0, sectionOf, SECTION_LABEL } from './lib/data'

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('fressnapf-auth') === 'true')
  const [tickets, setTickets] = useState(SEED_TICKETS)
  const [filters, setFilters] = useState({ status: [], classification: [], pillar: [], priority: [] })
  const [loading, setLoading] = useState(true)
  const [auditRefresh, setAuditRefresh] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [view, setView] = useState('fr')
  const [capWarning, setCapWarning] = useState('')
  const [search, setSearch] = useState('')

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
    if (field === 'priority' && newValue === 'P0') {
      const target = tickets.find(t => t.id === id)
      const section = sectionOf(target)
      const otherP0 = tickets.filter(t => t.priority === 'P0' && t.id !== id && sectionOf(t) === section).length
      if (otherP0 >= MAX_P0) {
        setCapWarning(`Only ${MAX_P0} ${SECTION_LABEL[section]} can be P0 at once — downgrade another before promoting this one (currently ${otherP0} at P0).`)
        return
      }
    }
    setCapWarning('')

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
    track('ticket_updated', { ticket_id: id, field, new_value: newValue })
    setAuditRefresh(prev => prev + 1)
  }, [tickets])

  const handleAdd = useCallback(async (ticketData) => {
    const result = await createTicket(ticketData)
    if (result.data) {
      setTickets(prev => [...prev, result.data])
      track('ticket_created', { topic: ticketData.topic })
      setShowAddForm(false)
    }
    return result
  }, [])

  const handleDelete = useCallback(async (id) => {
    const ticket = tickets.find(t => t.id === id)
    const result = await deleteTicket(id)
    if (!result.error) {
      setTickets(prev => prev.filter(t => t.id !== id))
      track('ticket_deleted', { ticket_id: id, topic: ticket?.topic })
    }
    return result
  }, [tickets])

  const q = search.trim().toLowerCase()
  const filteredTickets = tickets.filter(t => {
    if (filters.status.length && !filters.status.includes(t.fressnapf_status)) return false
    if (filters.classification.length && !filters.classification.includes(t.classification)) return false
    if (filters.pillar.length && !filters.pillar.includes(t.pillar)) return false
    if (filters.priority.length && !filters.priority.includes(t.priority || 'Unassigned')) return false
    if (q) {
      const haystack = [t.topic, t.summary, t.reporter, t.pillar, t.classification, t.engineering_ref, t.zendesk_ticket_id, t.notes]
        .map(v => String(v ?? '').toLowerCase())
        .join(' ')
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const featureRequests = filteredTickets.filter(t => t.classification === 'FR')
  const bugsAndIssues = filteredTickets.filter(t => t.classification === 'Bug' || t.classification === 'Product limitation')

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
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Ticket
            </button>
            <ExportButton tickets={filteredTickets} />
            <button
              onClick={() => { sessionStorage.removeItem('fressnapf-auth'); sessionStorage.removeItem('fressnapf-token'); setAuthed(false) }}
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
            <TopPriorities tickets={tickets} />
            <Filters filters={filters} setFilters={setFilters} />
            {capWarning && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                <span>🔴 {capWarning}</span>
                <button onClick={() => setCapWarning('')} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            )}
            <div className="mb-4 relative">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search topic, summary, reporter, Zendesk #, Eng ref, notes…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
              {q && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {featureRequests.length + bugsAndIssues.length} match{featureRequests.length + bugsAndIssues.length === 1 ? '' : 'es'}
                </span>
              )}
            </div>
            <ViewToggle view={view} setView={setView} frCount={featureRequests.length} bugCount={bugsAndIssues.length} />
            <div className="space-y-6">
              {view !== 'bugs' && (
                <TicketTable
                  title="💡 Feature Requests"
                  tickets={featureRequests}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  emptyLabel="No feature requests match the current filters."
                />
              )}
              {view !== 'fr' && (
                <TicketTable
                  title="🐞 Bugs & Issues"
                  tickets={bugsAndIssues}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  emptyLabel="No bugs or issues match the current filters."
                />
              )}
            </div>
            <div className="mt-6">
              <AuditLog refreshTrigger={auditRefresh} />
            </div>
          </>
        )}
      </main>

      {showAddForm && (
        <AddTicketForm onSubmit={handleAdd} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  )
}

function ViewToggle({ view, setView, frCount, bugCount }) {
  const options = [
    { id: 'all', label: 'All', count: frCount + bugCount },
    { id: 'fr', label: '💡 Feature Requests', count: frCount },
    { id: 'bugs', label: '🐞 Bugs & Issues', count: bugCount },
  ]

  const select = (id) => {
    setView(id)
    track('view_toggled', { view: id })
  }

  return (
    <div className="inline-flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-lg p-1">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => select(opt.id)}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
            view === opt.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {opt.label}
          <span className={`ml-1.5 text-xs ${view === opt.id ? 'text-blue-100' : 'text-gray-400'}`}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>
  )
}
