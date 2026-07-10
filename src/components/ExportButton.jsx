import { useState } from 'react'

export default function ExportButton({ tickets }) {
  const [copied, setCopied] = useState(false)

  const exportMarkdown = () => {
    const header = '| # | Topic | Type | Priority | Fressnapf | Amplitude | Pillar | Source | Eng Ref | PB Status |'
    const separator = '|---|-------|------|----------|-----------|-----------|--------|--------|---------|-----------|'
    const source = (t) => {
      if (t.zendesk_url) return `[ZD #${t.zendesk_ticket_id ?? ''}](${t.zendesk_url})`
      const slack = (t.notes || '').match(/https?:\/\/[^\s)]+slack\.com\/[^\s)]+/i)
      return slack ? `[Slack](${slack[0]})` : '—'
    }
    const engRef = (t) => {
      const refs = String(t.engineering_ref || '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
      if (refs.length === 0) return '—'
      return refs.map(r => /^[A-Za-z]{2,}-\d+$/.test(r) ? `[${r}](https://linear.app/amplitude/issue/${r})` : r).join(', ')
    }
    const rows = tickets.map(t =>
      `| ${t.id} | ${t.topic} | ${t.classification} | ${t.priority || 'Unassigned'} | ${t.fressnapf_status} | ${t.amplitude_status} | ${t.pillar} | ${source(t)} | ${engRef(t)} | ${t.productboard_status} |`
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
