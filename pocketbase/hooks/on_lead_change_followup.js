onRecordBeforeUpdateRequest((e) => {
  const oldFollowup = e.record.original().getString('proximo_followup')
  const newFollowup = e.record.getString('proximo_followup')

  if (oldFollowup !== newFollowup && newFollowup !== '') {
    e.record.set('notificacao_enviada', false)
  }

  e.next()
}, 'leads')
