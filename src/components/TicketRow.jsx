import { useState } from 'react'
import { track } from '../lib/analytics'

export default function TicketRow({ ticket, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')

  const isMisaligned = ticket.fressnapf_status === 'Open' && ticket.amplitude_status === 'Closed'
  const isOnHold = ticket.amplitude_status === 'On Hold'
  const isResolved = ticket.fressnapf_status === 'Fixed' || ticket.fressnapf_status === 'Done'

  const rowColor = isMisaligned
    ? 'bg-red-50 hover:bg-red-100'
    : isOnHold
    ? 'bg-yellow-50 hover:bg-yellow-100'
    : isResolved
    ? 'bg-green-50 hover:bg-green-100'
    : 'hover:bg-gray-50'

  const startEdit = (field, value, e) => {
    e.stopPropagation()
    setEditing(field)
    setEditValue(value || '')
  }

  const saveEdit = async (field) => {
    if (editValue !== (ticket[field] || '')) {
      await onUpdate(ticket.id, field, editValue, ticket[field])
    }
    setEditing(null)
  }

  const statusOptions = ['Open', 'Fixed', 'Done']
  const amplitudeStatusOptions = ['Unprocessed', 'In Engineering', 'On Hold', 'Closed', 'Resolved', 'Open']
  const pbStatusOptions = ['Not Logged', 'Unprocessed', 'Processed']

  return (
    <>
      <tr
        className={`border-b border-gray-100 cursor-pointer transition-colors ${rowColor}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-3 font-mono text-gray-500">{ticket.id}</td>
        <td className="px-3 py-3 font-medium text-gray-900">{ticket.topic}</td>
        <td className="px-3 py-3">
          <ClassificationBadge value={ticket.classification} />
        </td>
        <td className="px-3 py-3">
          {editing === 'fressnapf_status' ? (
            <select value={editValue} onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit('fressnapf_status')} onClick={e => e.stopPropagation()}
              className="text-xs border rounded px-1 py-0.5" autoFocus>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <StatusBadge value={ticket.fressnapf_status}
              onClick={e => startEdit('fressnapf_status', ticket.fressnapf_status, e)} editable />
          )}
        </td>
        <td className="px-3 py-3">
          {editing === 'amplitude_status' ? (
            <select value={editValue} onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit('amplitude_status')} onClick={e => e.stopPropagation()}
              className="text-xs border rounded px-1 py-0.5" autoFocus>
              {amplitudeStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <StatusBadge value={ticket.amplitude_status}
              onClick={e => startEdit('amplitude_status', ticket.amplitude_status, e)} editable />
          )}
        </td>
        <td className="px-3 py-3 text-gray-600">{ticket.pillar}</td>
        <td className="px-3 py-3">
          {editing === 'productboard_status' ? (
            <select value={editValue} onChange={e => setEditValue(e.target.value)}
              onBlur={() => saveEdit('productboard_status')} onClick={e => e.stopPropagation()}
              className="text-xs border rounded px-1 py-0.5" autoFocus>
              {pbStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <PbStatusBadge value={ticket.productboard_status}
              onClick={e => startEdit('productboard_status', ticket.productboard_status, e)} editable />
          )}
        </td>
        <td className="px-3 py-3 text-gray-400">
          {expanded ? '▲' : '▼'}
        </td>
      </tr>
      {expanded && (
        <tr className={rowColor}>
          <td colSpan="8" className="px-6 py-4">
            <ExpandedDetails ticket={ticket} onUpdate={onUpdate} onDelete={onDelete} />
          </td>
        </tr>
      )}
    </>
  )
}

function ExpandedDetails({ ticket, onUpdate, onDelete }) {
  const [noteEdit, setNoteEdit] = useState(false)
  const [noteValue, setNoteValue] = useState(ticket.notes || '')
  const [pmEdit, setPmEdit] = useState(false)
  const [pmValue, setPmValue] = useState(ticket.pm_owner || 'None')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveNote = async () => {
    if (noteValue !== ticket.notes) {
      await onUpdate(ticket.id, 'notes', noteValue, ticket.notes)
    }
    setNoteEdit(false)
  }

  const savePm = async () => {
    if (pmValue !== ticket.pm_owner) {
      await onUpdate(ticket.id, 'pm_owner', pmValue, ticket.pm_owner)
    }
    setPmEdit(false)
  }

  const handleDelete = async () => {
    await onDelete(ticket.id)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="space-y-2">
        <DetailRow label="Summary" value={ticket.summary} />
        <DetailRow label="Reporter" value={ticket.reporter} />
        <DetailRow label="Created" value={ticket.created_date} />
        <DetailRow label="Last Updated" value={ticket.last_updated ? new Date(ticket.last_updated).toLocaleDateString() : '—'} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-medium">PM Owner:</span>
            {pmEdit ? (
              <span onClick={e => e.stopPropagation()}>
                <input type="text" value={pmValue} onChange={e => setPmValue(e.target.value)}
                  onBlur={savePm} onKeyDown={e => { if (e.key === 'Enter') savePm(); if (e.key === 'Escape') setPmEdit(false) }}
                  className="text-xs border rounded px-2 py-0.5 w-32" autoFocus />
              </span>
            ) : (
              <span className="text-gray-800 text-xs cursor-pointer hover:text-blue-600"
                onClick={e => { e.stopPropagation(); setPmEdit(true) }}>
                {ticket.pm_owner || 'None'} <span className="text-blue-500 text-[10px]">edit</span>
              </span>
            )}
          </div>
        </div>
        {ticket.engineering_ref && (
          <DetailRow label="Engineering Ref" value={ticket.engineering_ref} />
        )}
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-gray-500 text-xs font-medium">Zendesk:</span>{' '}
          {ticket.zendesk_url ? (
            <a href={ticket.zendesk_url} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
              onClick={e => { e.stopPropagation(); track('link_clicked', { link_type: 'ticket', ticket_id: ticket.id }) }}>
              #{ticket.zendesk_ticket_id}
            </a>
          ) : '—'}
        </div>
        <div>
          <span className="text-gray-500 text-xs font-medium">Productboard:</span>{' '}
          {ticket.productboard_url ? (
            <a href={ticket.productboard_url} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
              onClick={e => { e.stopPropagation(); track('link_clicked', { link_type: 'PB', ticket_id: ticket.id }) }}>
              Note {ticket.productboard_note_id}
            </a>
          ) : <span className="text-gray-400 text-xs">Not logged</span>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-medium">Notes:</span>
            {!noteEdit && (
              <button onClick={e => { e.stopPropagation(); setNoteEdit(true) }}
                className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
            )}
          </div>
          {noteEdit ? (
            <div className="mt-1" onClick={e => e.stopPropagation()}>
              <textarea value={noteValue} onChange={e => setNoteValue(e.target.value)}
                className="w-full border rounded p-2 text-xs resize-y min-h-[60px]" autoFocus />
              <div className="flex gap-2 mt-1">
                <button onClick={saveNote} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                <button onClick={() => { setNoteEdit(false); setNoteValue(ticket.notes || '') }}
                  className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-xs mt-1">{ticket.notes || '—'}</p>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 mt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <span className="text-xs text-red-600">Delete this ticket?</span>
              <button onClick={handleDelete}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded">Confirm</button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="text-xs text-red-500 hover:text-red-700">Delete ticket</button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-gray-500 text-xs font-medium">{label}:</span>{' '}
      <span className="text-gray-800 text-xs">{value || '—'}</span>
    </div>
  )
}

function ClassificationBadge({ value }) {
  const colors = {
    'Bug': 'bg-red-100 text-red-700',
    'FR': 'bg-purple-100 text-purple-700',
    'Product limitation': 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  )
}

function StatusBadge({ value, onClick, editable }) {
  const colors = {
    'Open': 'bg-red-100 text-red-700',
    'Fixed': 'bg-green-100 text-green-700',
    'Done': 'bg-green-100 text-green-700',
    'Closed': 'bg-gray-100 text-gray-600',
    'Resolved': 'bg-green-100 text-green-700',
    'On Hold': 'bg-yellow-100 text-yellow-700',
    'In Engineering': 'bg-blue-100 text-blue-700',
    'Unprocessed': 'bg-orange-100 text-orange-700',
  }
  return (
    <span onClick={editable ? onClick : undefined}
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}>
      {value}
    </span>
  )
}

function PbStatusBadge({ value, onClick, editable }) {
  const colors = {
    'Unprocessed': 'bg-orange-100 text-orange-700',
    'Processed': 'bg-green-100 text-green-700',
    'Not Logged': 'bg-red-100 text-red-700',
  }
  return (
    <span onClick={editable ? onClick : undefined}
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}>
      {value}
    </span>
  )
}
