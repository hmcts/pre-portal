import { AccessStatus } from './access-status';

export interface Role {
  description: string;
  id: string;
  name: string;
  permissions:
    | [
        {
          id: string;
          name: string;
        },
      ]
    | [];
}

export interface AppAccess {
  active: boolean;
  court: {
    id: string;
    name: string;
    court_type: string;
    location_code: string;
    regions: [
      {
        name: string;
      },
    ];
    rooms: [];
  };
  id: string;
  last_access: string | null;
  default_court: boolean | null;
  role: Role;
}

export interface PortalAccess {
  deleted_at: string | null;
  id: string;
  invited_at: string;
  last_access: string | null;
  registered_at: string | null;
  status: AccessStatus;
}

export interface UserProfile {
  app_access: AppAccess[];
  portal_access: PortalAccess[];
  terms_accepted: {
    [key: string]: boolean;
  } | null;

  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    organisation: string | null;
    terms_accepted: {
      [key: string]: boolean;
    } | null;
  };
}
