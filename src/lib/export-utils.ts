function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateCell(val: string): string {
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(val)) {
    const parsed = new Date(val)
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getUTCDate()).padStart(2, '0')
      const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
      const year = parsed.getUTCFullYear()
      const hours = String(parsed.getUTCHours()).padStart(2, '0')
      const minutes = String(parsed.getUTCMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
  }
  return val
}

export interface ExportColumn {
  header: string
  key: string
}

export interface ExportSummary {
  total: number
  date: string
  datetime: string
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToExcel(
  title: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
): void {
  const headerCells = columns
    .map(
      (c) =>
        `<th style="background:#003366;color:#fff;font-weight:bold;border:1px solid #003366;padding:4px 8px;">${escapeHtml(c.header)}</th>`,
    )
    .join('')

  const bodyRows = data
    .map((d, i) => {
      const bg = i % 2 === 0 ? '#F2F2F2' : '#FFFFFF'
      const cells = columns
        .map((c) => {
          const val = d[c.key]
          const text = val === null || val === undefined ? '' : formatDateCell(String(val))
          return `<td style="background:${bg};border:1px solid #ccc;padding:4px 8px;">${escapeHtml(text)}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const table = `<table><tr>${headerCells}</tr>${bodyRows}</table>`
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${table}</body></html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  downloadBlob(blob, `${title}.xls`)
}

export function exportToPDF(
  title: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  summary?: ExportSummary,
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  const headerCells = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')

  const bodyRows = data
    .map((d, i) => {
      const cells = columns
        .map((c) => {
          const val = d[c.key]
          const text = val === null || val === undefined ? '' : formatDateCell(String(val))
          return `<td>${escapeHtml(text)}</td>`
        })
        .join('')
      return `<tr class="${i % 2 === 0 ? 'stripe' : ''}">${cells}</tr>`
    })
    .join('')

  const summaryHtml = summary
    ? `<div class="summary"><p>Total de registros: ${summary.total}</p><p>Data de exportação: ${summary.date}</p></div>`
    : ''

  const footerHtml = summary ? `<div class="footer">Gerado em: ${summary.datetime}</div>` : ''

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;padding:20px}
    h1{font-size:18px;margin-bottom:12px;color:#003366}
    .summary{margin-bottom:16px;color:#666;font-size:12px}
    .summary p{margin-bottom:4px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#003366;color:#fff;padding:6px 8px;text-align:left;border:1px solid #003366}
    td{padding:4px 8px;border:1px solid #ddd}
    tr.stripe td{background:#F2F2F2}
    .footer{margin-top:20px;font-size:10px;color:#999}
    @media print{body{padding:0}}
  </style></head><body><h1>${escapeHtml(title)}</h1>${summaryHtml}<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>${footerHtml}</body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}
