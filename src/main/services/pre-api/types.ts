import { AppAccess, PortalAccess } from '../../types/user-profile';
import { AccessStatus } from '../../types/access-status';

export interface PaginatedRequest {
  page?: number;
  size?: number;
}

export interface SearchRecordingsRequest extends PaginatedRequest {
  captureSessionId?: string;
  parentRecordingId?: string;
  participantId?: string;
  witnessName?: string;
  defendantName?: string;
  caseReference?: string;
  scheduledFor?: string;
  courtId?: string;
  includeDeleted?: boolean;
}

export interface SearchUsersRequest extends PaginatedRequest {
  name?: string;
  email?: string;
  organisation?: string;
  courtId?: string;
  roleId?: string;
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

export interface Court {
  id: string;
  name: string;
  court_type: string;
  location_code: string;
  regions: { name: string }[];
  rooms: { id: string; name: string }[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organisation?: string;
  app_access: AppAccess[];
  portal_access: PortalAccess[];
  terms_accepted: {
    [key: string]: boolean;
  } | null;
  created_at: string;
  modified_at: string;
  deleted_at?: string;
}

export interface PutAppAccessRequest {
  id: string;
  user_id: string;
  court_id: string;
  role_id: string;
  default_court: boolean;
  active: boolean;
  last_access: string;
}

export interface PutPortalAccessRequest {
  id: string;
  user_id: string;
  invited_at: string;
  last_access: string | null;
  registered_at: string | null;
  status: AccessStatus;
}

export interface PutUserRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organisation?: string;
  app_access: PutAppAccessRequest[];
  portal_access: PutPortalAccessRequest[];
}
