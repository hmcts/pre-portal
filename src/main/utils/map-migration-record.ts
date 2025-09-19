export function mapMigrationRecord(record: any) {
  return {
    recordId: record.id,
    archiveId: record.archive_id || '',
    urn: record.urn || '',
    court: record.court_reference || '',
    courtId: record.court_id || '',
    exhibitReference: record.exhibit_reference || '',
    witnessName: record.witness_name || '',
    defendantName: record.defendant_name || '',
    recordingVersion: record.recording_version || '',
    recordingVersionNumber: record.recording_version_number || '',
    duration: record.duration || '',
    reason: record.error_message || '',
    status: record.status || '',
    createDate: record.create_time || '',
  };
}
