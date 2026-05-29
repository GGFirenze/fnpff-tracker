import { useState } from 'react'

export default function AddTicketForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    topic: '',
    summary: '',
    classification: 'FR',
    fressnapf_status: 'Open',
    amplitude_status: 'Unprocessed',
    zendesk_ticket_id: '',
    zendesk_url: '',
    productboard_note_id: '',
    productboard_url: '',
    productboard_status: 'Not Logged',
    pm_owner: 'None',
    pillar: 'Governance',
    reporter: '',
    notes: '',
    engineering_ref: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.topic.trim()) return setError('Topic is required')
    setSubmitting(true)
    setError(null)

    const result = await onSubmit({
      ...form,
      zendesk_url: form.zendesk_ticket_id
        ? `https://gethelp.amplitude.com/hc/requests/${form.zendesk_ticket_id}`
        : '',
      productboard_url: form.productboard_note_id
        ? `https://app.productboard.com/notes/${form.productboard_note_id}`
        : '',
      created_date: new Date().toISOString().split('T')[0],
    })

    if (result?.error) {
      setError(result.error)
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Add New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Topic *" value={form.topic} onChange={v => handleChange('topic', v)} />
          <Field label="Summary" value={form.summary} onChange={v => handleChange('summary', v)} textarea />
          
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Classification" value={form.classification}
              options={['Bug', 'FR', 'Product limitation']}
              onChange={v => handleChange('classification', v)} />
            <SelectField label="Pillar" value={form.pillar}
              options={['Governance', 'Analytics', 'Data Management']}
              onChange={v => handleChange('pillar', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Fressnapf Status" value={form.fressnapf_status}
              options={['Open', 'Fixed', 'Done']}
              onChange={v => handleChange('fressnapf_status', v)} />
            <SelectField label="Amplitude Status" value={form.amplitude_status}
              options={['Unprocessed', 'In Engineering', 'On Hold', 'Closed', 'Resolved', 'Open']}
              onChange={v => handleChange('amplitude_status', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="PB Status" value={form.productboard_status}
              options={['Not Logged', 'Unprocessed', 'Processed']}
              onChange={v => handleChange('productboard_status', v)} />
            <Field label="PM Owner" value={form.pm_owner} onChange={v => handleChange('pm_owner', v)} />
          </div>

          <Field label="Reporter" value={form.reporter} onChange={v => handleChange('reporter', v)} />
          <Field label="Zendesk Ticket ID" value={form.zendesk_ticket_id} onChange={v => handleChange('zendesk_ticket_id', v)} placeholder="e.g. 394661" />
          <Field label="Productboard Note ID" value={form.productboard_note_id} onChange={v => handleChange('productboard_note_id', v)} placeholder="e.g. 51713875" />
          <Field label="Engineering Ref" value={form.engineering_ref} onChange={v => handleChange('engineering_ref', v)} placeholder="e.g. AMP-148857, CAP-388" />
          <Field label="Notes" value={form.notes} onChange={v => handleChange('notes', v)} textarea />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Ticket'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, placeholder }) {
  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={`${cls} resize-y min-h-[60px]`} placeholder={placeholder} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
