import { MAX_P0, sectionOf } from '../lib/data'
import { track } from '../lib/analytics'

export default function TopPriorities({ tickets }) {
  const p0 = tickets.filter(t => t.priority === 'P0')
  const p1 = tickets.filter(t => t.priority === 'P1')
  const needsTriage = tickets.filter(t => !t.priority || t.priority === 'Unassigned').length
  const frP0 = p0.filter(t => sectionOf(t) === 'fr').length
  const bugP0 = p0.filter(t => sectionOf(t) === 'bugs').length
  const top = [...p0, ...p1]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Top Priorities</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>{tickets.length} total</span>
          <span className={frP0 > MAX_P0 ? 'text-red-600 font-semibold' : 'text-red-600'}>
            FR P0 {frP0}/{MAX_P0}
          </span>
          <span className={bugP0 > MAX_P0 ? 'text-red-600 font-semibold' : 'text-red-600'}>
            Bug P0 {bugP0}/{MAX_P0}
          </span>
          <span className="text-orange-600">P1 {p1.length}</span>
          <span>{needsTriage} need triage</span>
        </div>
      </div>

      {top.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No P0 or P1 items yet — set priorities on the board to surface the make-or-break list.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {top.map(t => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <PriorityTag value={t.priority} />
              <TypeTag value={t.classification} />
              <span className="flex-1 truncate text-sm font-medium text-gray-900">{t.topic}</span>
              <span className="hidden w-28 text-right text-xs text-gray-500 sm:inline">{t.amplitude_status}</span>
              {t.zendesk_url ? (
                <a
                  href={t.zendesk_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('link_clicked', { link_type: 'ticket', ticket_id: t.id })}
                  className="w-16 text-right text-xs text-blue-600 hover:underline"
                >
                  #{t.zendesk_ticket_id}
                </a>
              ) : (
                <span className="w-16 text-right text-xs text-gray-300">—</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PriorityTag({ value }) {
  const colors = {
    'P0': 'bg-red-100 text-red-700 ring-1 ring-red-300',
    'P1': 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`w-8 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  )
}

function TypeTag({ value }) {
  const colors = {
    'FR': 'bg-purple-100 text-purple-700',
    'Bug': 'bg-red-100 text-red-700',
    'Product limitation': 'bg-gray-100 text-gray-700',
  }
  const label = value === 'Product limitation' ? 'Limitation' : value
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}
