export interface ExportColumn {
  header: string
  key: string
}

export interface ExportGroup {
  title: string
  columns: ExportColumn[]
  records: Record<string, unknown>[]
  subtotal: { label: string; value: string }[]
}

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

function buildSubtotalText(group: ExportGroup): string {
  return group.subtotal.map((s) => `${s.label}: ${s.value}`).join('   |   ')
}

export function exportGroupedToExcel(
  company: string,
  period: string,
  groups: ExportGroup[],
  grandTotal: { label: string; value: string }[],
  filename: string,
): void {
  const colCount = groups[0]?.columns.length ?? 1

  const groupHtml = groups
    .map((g) => {
      const headerCells = g.columns
        .map(
          (c) =>
            `<th style="background:#003366;color:#fff;font-weight:bold;border:1px solid #003366;padding:4px 8px;">${escapeHtml(c.header)}</th>`,
        )
        .join('')
      const bodyRows = g.records
        .map((d, i) => {
          const bg = i % 2 === 0 ? '#F2F2F2' : '#FFFFFF'
          const cells = g.columns
            .map((c) => {
              const val = d[c.key]
              const text = val === null || val === undefined ? '' : String(val)
              return `<td style="background:${bg};border:1px solid #ccc;padding:4px 8px;">${escapeHtml(text)}</td>`
            })
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      const subtotalRow = `<tr><td colspan="${colCount}" style="background:#D9E1F2;border:1px solid #ccc;padding:6px 8px;font-weight:bold;">${escapeHtml(buildSubtotalText(g))}</td></tr>`
      const titleRow = `<tr><td colspan="${colCount}" style="background:#1F4E79;color:#fff;font-weight:bold;border:1px solid #1F4E79;padding:6px 8px;font-size:13px;">${escapeHtml(g.title)}</td></tr>`
      return `${titleRow}<tr>${headerCells}</tr>${bodyRows}${subtotalRow}<tr><td colspan="${colCount}" style="border:none;padding:6px 0;">&nbsp;</td></tr>`
    })
    .join('')

  const grandText = grandTotal.map((s) => `${s.label}: ${s.value}`).join('   |   ')
  const grandRow = `<tr><td colspan="${colCount}" style="background:#003366;color:#fff;font-weight:bold;border:1px solid #003366;padding:8px;font-size:13px;">${escapeHtml(grandText)}</td></tr>`

  const companyRow = `<tr><td colspan="${colCount}" style="font-size:16px;font-weight:bold;color:#003366;padding:4px 0 2px;">${escapeHtml(company)}</td></tr>`
  const periodRow = `<tr><td colspan="${colCount}" style="font-size:12px;color:#555;padding:0 0 8px;">Período: ${escapeHtml(period)}</td></tr>`

  const table = `<table>${companyRow}${periodRow}${groupHtml}${grandRow}</table>`
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${table}</body></html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  downloadBlob(blob, `${filename}.xls`)
}

export function exportGroupedToPDF(
  company: string,
  period: string,
  groups: ExportGroup[],
  grandTotal: { label: string; value: string }[],
  title: string,
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  const colCount = groups[0]?.columns.length ?? 1

  const groupHtml = groups
    .map((g) => {
      const headerCells = g.columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
      const bodyRows = g.records
        .map((d, i) => {
          const cells = g.columns
            .map((c) => {
              const val = d[c.key]
              const text = val === null || val === undefined ? '' : String(val)
              return `<td>${escapeHtml(text)}</td>`
            })
            .join('')
          return `<tr class="${i % 2 === 0 ? 'stripe' : ''}">${cells}</tr>`
        })
        .join('')
      const subtotalRow = `<tr class="subtotal-row"><td colspan="${colCount}">${escapeHtml(buildSubtotalText(g))}</td></tr>`
      return `<div class="group-section"><div class="group-title">${escapeHtml(g.title)}</div><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}${subtotalRow}</tbody></table></div>`
    })
    .join('')

  const grandText = grandTotal.map((s) => `${s.label}: ${s.value}`).join('   |   ')
  const grandHtml = `<div class="grand-total">TOTAL GERAL — ${escapeHtml(grandText)}</div>`

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;padding:20px;color:#222}
    .doc-header{margin-bottom:16px;border-bottom:2px solid #003366;padding-bottom:8px}
    .doc-header h1{font-size:18px;color:#003366}
    .doc-header .period{font-size:12px;color:#666;margin-top:4px}
    .group-section{margin-bottom:18px;page-break-inside:avoid}
    .group-title{background:#1F4E79;color:#fff;padding:6px 8px;font-weight:bold;font-size:13px;border-radius:3px 3px 0 0}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:0}
    th{background:#003366;color:#fff;padding:5px 8px;text-align:left;border:1px solid #003366}
    td{padding:4px 8px;border:1px solid #ddd}
    tr.stripe td{background:#F2F2F2}
    .subtotal-row td{background:#D9E1F2;font-weight:bold;font-size:11px}
    .grand-total{margin-top:8px;background:#003366;color:#fff;padding:10px;font-weight:bold;font-size:13px;border-radius:3px;page-break-inside:avoid}
    @page{size:A4;margin:14mm}
    @media print{body{padding:0}.group-section{page-break-inside:avoid}}
  </style></head><body><div class="doc-header"><h1>${escapeHtml(company)}</h1><div class="period">Relatório de Contatos por Vendedor — Período: ${escapeHtml(period)}</div></div>${groupHtml}${grandHtml}</body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}
