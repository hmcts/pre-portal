export interface VfMigrationRecord {
  archiveId: string;
  archiveName: string;
  court: string;
  urn: string;
  exhibitReference: string;
  witnessName: string;
  defendantName: string;
  recordingVersion: string;
  recordingVersionNumber: string;
  duration: string;
  reasonIn: string;
  status: string | undefined;
  reason: string;
  createDate: string;
}
