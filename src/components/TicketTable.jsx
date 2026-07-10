import { useState } from 'react'
import TicketRow from './TicketRow'

export default function TicketTable({ tickets, onUpdate, onDelete, title, emptyLabel }) {
  const [sortField, setSortField] = useState('id')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...tickets].sort((a, b) => {
    const aVal = a[sortField] ?? ''
    const bVal = b[sortField] ?? ''
    const cmp = typeof aVal === 'number'
      ? aVal - bVal
      : String(aVal).localeCompare(String(bVal))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const columns = [
    { key: 'id', label: '#', width: 'w-12' },
    { key: 'topic', label: 'Topic', width: 'w-64' },
    { key: 'classification', label: 'Type', width: 'w-28' },
    { key: 'priority', label: 'Priority', width: 'w-24' },
    { key: 'fressnapf_status', label: 'Fressnapf', width: 'w-24' },
    { key: 'amplitude_status', label: 'Amplitude', width: 'w-28' },
    { key: 'pillar', label: 'Pillar', width: 'w-28' },
    { key: 'zendesk_ticket_id', label: 'Source', width: 'w-24' },
    { key: 'engineering_ref', label: 'Eng Ref', width: 'w-24' },
    { key: 'productboard_status', label: 'PB Status', width: 'w-28' },
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <span className="text-xs text-gray-500">{tickets.length}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none ${col.width}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(ticket => (
              <TicketRow key={ticket.id} ticket={ticket} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          {emptyLabel || 'No tickets match the current filters.'}
        </div>
      )}
    </div>
  )
}
