migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const statusField = leads.fields.getByName('status')
    if (statusField) {
      const currentValues = statusField.values || []
      if (currentValues.indexOf('expirado') === -1) {
        statusField.values = currentValues.concat(['expirado'])
        app.save(leads)
      }
    }
  },
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    const statusField = leads.fields.getByName('status')
    if (statusField && statusField.values) {
      statusField.values = statusField.values.filter(function (v) {
        return v !== 'expirado'
      })
      app.save(leads)
    }
  },
)
