import { useState } from 'react'

export default function ExportButton({ tickets }) {
  const [copied, setCopied] = useState(false)

  const exportMarkdown = () => {
    const header = '| # | Topic | Type | Fressnapf | Amplitude | Pillar | PB Status |'
    const separator = '|---|-------|------|-----------|-----------|--------|-----------|'
    const rows = tickets.map(t =>
      `| ${t.id} | ${t.topic} | ${t.classification} | ${t.fressnapf_status} | ${t.amplitude_status} | ${t.pillar} | ${t.productboard_status} |`
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
