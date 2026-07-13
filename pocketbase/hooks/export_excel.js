// @deps xlsx-js-style@1.2.0
routerAdd(
  'POST',
  '/backend/v1/export/excel',
  (e) => {
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = globalThis
      globalThis.navigator = { userAgent: 'node' }
      globalThis.document = { createElement: () => ({ style: {} }) }
    }

    const XLSX = require('xlsx-js-style')
    const body = e.requestInfo().body

    if (!body || !body.columns || !body.data) {
      return e.badRequestError('Missing columns or data')
    }

    const { title, columns, data } = body

    const headers = columns.map((c) => c.header)
    const keys = columns.map((c) => c.key)

    function formatDateCell(val) {
      if (typeof val !== 'string') return val
      if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(val)) {
        try {
          var parsed = new Date(val)
          if (!isNaN(parsed.getTime())) {
            var day = String(parsed.getUTCDate()).padStart(2, '0')
            var month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
            var year = parsed.getUTCFullYear()
            var hours = String(parsed.getUTCHours()).padStart(2, '0')
            var minutes = String(parsed.getUTCMinutes()).padStart(2, '0')
            return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes
          }
        } catch (e) {}
      }
      return val
    }

    const rows = [headers]
    data.forEach((d) => {
      rows.push(
        keys.map((k) => {
          const val = d[k]
          if (val === null || val === undefined) return ''
          return formatDateCell(String(val))
        }),
      )
    })

    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Style headers
    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ c: i, r: 0 })
      if (!worksheet[cellRef]) continue
      worksheet[cellRef].s = {
        font: { bold: true },
      }
    }

    // Style body rows for zebra striping
    for (let r = 1; r < rows.length; r++) {
      for (let c = 0; c < headers.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ c: c, r: r })
        if (!worksheet[cellRef]) continue
        if (r % 2 === 1) {
          // 1-based index means odd rows get the stripe (Light Gray)
          if (!worksheet[cellRef].s) worksheet[cellRef].s = {}
          worksheet[cellRef].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: 'FFF2F2F2' },
          }
        }
      }
    }

    // Adjust column widths
    worksheet['!cols'] = columns.map(() => ({ wch: 20 }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, title ? title.substring(0, 31) : 'Export')

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

    return e.blob(200, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer)
  },
  $apis.requireAuth(),
)
