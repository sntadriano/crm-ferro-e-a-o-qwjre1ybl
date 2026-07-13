// @deps jspdf@2.5.1, jspdf-autotable@3.8.2
routerAdd(
  'POST',
  '/backend/v1/export/pdf',
  (e) => {
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = globalThis
      globalThis.navigator = { userAgent: 'node' }
      globalThis.document = { createElement: () => ({ style: {} }) }
    }

    const { jsPDF } = require('jspdf')
    require('jspdf-autotable')

    const body = e.requestInfo().body
    if (!body || !body.columns || !body.data || !body.summary) {
      return e.badRequestError('Missing columns, data or summary')
    }

    const { title, columns, data, summary } = body

    const doc = new jsPDF('landscape')

    // Title
    doc.setFontSize(16)
    doc.text(title || 'Relatório de Exportação', 14, 22)

    // Summary
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Total de registros: ${summary.total}`, 14, 30)
    doc.text(`Data de exportação: ${summary.date}`, 14, 36)

    // Table
    const head = [columns.map((c) => c.header)]
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

    const bodyData = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        return formatDateCell(String(val))
      }),
    )

    doc.autoTable({
      startY: 42,
      head: head,
      body: bodyData,
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      theme: 'grid',
      styles: { fontSize: 9 },
      didDrawPage: function (dataHook) {
        // Footer
        doc.setFontSize(8)
        doc.setTextColor(150)
        var pageSize = doc.internal.pageSize
        var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
        doc.text('Gerado em: ' + summary.datetime, dataHook.settings.margin.left, pageHeight - 10)
      },
    })

    const arrayBuffer = doc.output('arraybuffer')

    return e.blob(200, 'application/pdf', arrayBuffer)
  },
  $apis.requireAuth(),
)
