import { useState } from 'react'

export default function ExportButton({ tickets }) {
  const [copied, setCopied] = useState(false)

  const exportMarkdown = () => {
    const header = '| # | Topic | Type | Priority | Fressnapf | Amplitude | Pillar | Source | Eng Ref | PB Status |'
    const separator = '|---|-------|------|----------|-----------|-----------|--------|--------|---------|-----------|'
    const source = (t) => t.zendesk_url
      ? `[ZD #${t.zendesk_ticket_id ?? ''}](${t.zendesk_url})`
      : ((t.notes || '').match(/https?:\/\/[^\s)]+slack\.com\/[^\s)]+/i)?.[0] ? `[Slack](${(t.notes || '').match(/https?:\/\/[^\s)]+slack\.com\/[^\s)]+/i)[0]})` : '—')
    const rows = tickets.map(t =>
      `| ${t.id} | ${t.topic} | ${t.classification} | ${t.priority || 'Unassigned'} | ${t.fressnapf_status} | ${t.amplitude_status} | ${t.pillar} | ${source(t)} | ${t.engineering_ref || '—'} | ${t.productboard_status} |`
    )

    const markdown = [header, separator, ...rows].join('\n')
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={exportMarkdown}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        copied
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {copied ? 'Copied!' : 'Export as Markdown'}
    </button>
  )
}
