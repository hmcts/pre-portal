export interface SearchRecordingsRequest {
  captureSessionId?: string;
  parentRecordingId?: string;
  participantId?: string;
  witnessName?: string;
  defendantName?: string;
  caseReference?: string;
  scheduledFor?: string;
  courtId?: string;
  includeDeleted?: boolean;
  version?: number;
  page?: number;
  size?: number;
}

export interface SearchEditsRequest {
  sourceRecordingId?: string;
  lastModifiedAfter?: string;
  lastModifiedBefore?: string;
  page?: number;
  size?: number;
}

export interface CaptureSession {
  id: string;
  booking_id: string;
  origin: string;
  ingest_address: string;
  live_output_url: string;
  started_at: string;
  started_by_user_id: string;
  finished_at: string;
  finished_by_user_id: string;
  status: string;
  deleted_at: string;
  court_name: string;
  case_state: string;
  case_closed_at?: string;
  case_reference?: string;
}

export interface Recording {
  id: string;
  parent_recording_id: string;
  version: number;
  filename: string;
  duration: string;
  edit_instructions: string;
  capture_session: CaptureSession;
  deleted_at: string;
  created_at: string;
  case_id: string;
  case_reference: string;
  is_test_case: boolean;
  participants: Participant[];
  edit_status?: string;
}

export interface Participant {
  id: string;
  participant_type: string;
  first_name: string;
  last_name: string;
  deleted_at: string;
  created_at: string;
  modified_at: string;
}

export interface RecordingPlaybackData {
  src: string;
  type: string;
  protectionInfo: { [key: string]: string }[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface PutAuditRequest {
  id: string;
  category: string;
  activity: string;
  functional_area: string;
  source: string;
  table_name?: string;
  table_record_id?: string;
  audit_details: { [key: string]: string };
}

export interface PutEditRequest {
  id: string;
  source_recording_id: string;
  status: string;
  edit_instructions: PutEditInstruction[];
  jointly_agreed?: boolean;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface PutEditInstruction {
  start_of_cut: string;
  end_of_cut: string;
  difference?: string;
  reason?: string;
}

export interface EditRequest {
  id: string;
  source_recording?: Recording;
  status: string;
  started_at?: string;
  started_by_user_id?: string;
  finished_at?: string;
  edit_instruction: EditInstruction;
  jointly_agreed?: boolean;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  modified_at: string;
}

export interface EditInstruction {
  requestedInstructions: PutEditInstruction[];
}

export interface RecordingAppliedEdits {
  editRequestId: string;
  editInstructions: EditInstruction;
}

export interface AppliedEditInstruction {
  start: number;
  end: number;
  startOfCut: string;
  endOfCut: string;
  reason: number;
  runtimeReference?: string;
}
