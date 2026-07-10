import { track } from '../lib/analytics'

export default function Filters({ filters, setFilters }) {
  const statusOptions = ['Open', 'Fixed', 'Done']
  const classificationOptions = ['Bug', 'FR', 'Product limitation']
  const pillarOptions = ['Governance', 'Analytics', 'Data Management']
  const priorityOptions = ['P0', 'P1', 'P2', 'P3', 'Unassigned']

  const toggleFilter = (category, value) => {
    track('filter_clicked', { filter_name: category, filter_value: value })
    setFilters(prev => {
      const current = prev[category] || []
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: next }
    })
  }

  const clearAll = () => {
    setFilters({ status: [], classification: [], pillar: [], priority: [] })
  }

  const hasFilters = Object.values(filters).some(arr => arr.length > 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterGroup
          label="Priority"
          options={priorityOptions}
          selected={filters.priority}
          onToggle={(val) => toggleFilter('priority', val)}
        />
        <FilterGroup
          label="Fressnapf Status"
          options={statusOptions}
          selected={filters.status}
          onToggle={(val) => toggleFilter('status', val)}
        />
        <FilterGroup
          label="Classification"
          options={classificationOptions}
          selected={filters.classification}
          onToggle={(val) => toggleFilter('classification', val)}
        />
        <FilterGroup
          label="Pillar"
          options={pillarOptions}
          selected={filters.pillar}
          onToggle={(val) => toggleFilter('pillar', val)}
        />
      </div>
    </div>
  )
}

function FilterGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              selected.includes(opt)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
