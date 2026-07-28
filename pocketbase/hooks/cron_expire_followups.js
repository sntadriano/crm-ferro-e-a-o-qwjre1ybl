cronAdd('expire_stale_followups', '0 2 * * *', () => {
  const now = new Date()
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Use full ISO datetime for the cutoff so the string comparison
  // respects the time portion of proximo_followup. A follow-up
  // scheduled for today at a future time is NOT expired — only
  // those 30+ days in the past (including time) are marked expired.
  const cutoffStr = cutoff.toISOString().replace('T', ' ').substring(0, 19)

  let expiredCount = 0
  try {
    const staleLeads = $app.findRecordsByFilter(
      'leads',
      "status != 'fechado' && status != 'perdido' && status != 'expirado' && proximo_followup != '' && proximo_followup < '" +
        cutoffStr +
        "'",
      '',
      500,
      0,
    )

    for (const lead of staleLeads) {
      try {
        lead.set('status', 'expirado')
        $app.save(lead)
        expiredCount++
      } catch (e) {
        $app
          .logger()
          .error('Failed to expire stale followup', 'lead_id', lead.id, 'error', e.message)
      }
    }

    if (expiredCount > 0) {
      $app.logger().info('Expired stale follow-ups', 'count', expiredCount)
    }
  } catch (e) {
    $app.logger().error('Error in expire_stale_followups cron', 'error', e.message)
  }
})
