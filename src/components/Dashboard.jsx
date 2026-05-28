export default function Dashboard({ tickets }) {
  const total = tickets.length
  const openCount = tickets.filter(t => t.fressnapf_status === 'Open').length
  const fixedCount = tickets.filter(t => t.fressnapf_status === 'Fixed').length
  const doneCount = tickets.filter(t => t.fressnapf_status === 'Done').length

  const pbUnprocessed = tickets.filter(t => t.productboard_status === 'Unprocessed').length
  const pbNotLogged = tickets.filter(t => t.productboard_status === 'Not Logged').length
  const noPmOwner = tickets.filter(t => t.pm_owner === 'None').length

  const misaligned = tickets.filter(
    t => t.fressnapf_status === 'Open' && (t.amplitude_status === 'Closed')
  ).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Tickets" value={total} color="gray" />
      <StatCard label="Open (Fressnapf)" value={openCount} color="red" />
      <StatCard label="Fixed" value={fixedCount} color="green" />
      <StatCard label="Misaligned" value={misaligned} color="orange" subtitle="Open but Closed in ZD" />

      <StatCard label="PB Unprocessed" value={pbUnprocessed} color="yellow" />
      <StatCard label="Not in PB" value={pbNotLogged} color="red" />
      <StatCard label="No PM Owner" value={noPmOwner} color="red" />
      <StatCard label="Done" value={doneCount} color="green" />
    </div>
  )
}

function StatCard({ label, value, color, subtitle }) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
    </div>
  )
}
