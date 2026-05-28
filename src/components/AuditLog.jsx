import { useState, useEffect } from 'react'
import { getAuditLog } from '../lib/api'

export default function AuditLog({ refreshTrigger }) {
  const [entries, setEntries] = useState([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expanded) {
      setLoading(true)
      getAuditLog(50).then(data => {
        setEntries(data)
        setLoading(false)
      })
    }
  }, [expanded, refreshTrigger])

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Audit Log</span>
          {entries.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {entries.length} entries
            </span>
          )}
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No changes recorded yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600">Time</th>
                  <th className="px-3 py-2 text-left text-gray-600">Ticket</th>
                  <th className="px-3 py-2 text-left text-gray-600">Field</th>
                  <th className="px-3 py-2 text-left text-gray-600">From</th>
                  <th className="px-3 py-2 text-left text-gray-600">To</th>
                  <th className="px-3 py-2 text-left text-gray-600">By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(entry.changed_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono">#{entry.ticket_id}</td>
                    <td className="px-3 py-2 text-gray-700">{entry.field_changed}</td>
                    <td className="px-3 py-2 text-red-600 line-through">{entry.old_value || '—'}</td>
                    <td className="px-3 py-2 text-green-600">{entry.new_value || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{entry.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
