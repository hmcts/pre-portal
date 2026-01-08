import { AccessStatus } from './access-status';

export interface UserProfile {
  app_access:
    | [
        {
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
          role: {
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
          };
        },
      ]
    | [];

  portal_access:
    | [
        {
          deleted_at: string | null;
          id: string;
          invited_at: string;
          last_access: string | null;
          registered_at: string | null;
          status: AccessStatus;
        },
      ]
    | [];

  terms_accepted: {
    [key: string]: boolean;
  } | null;

  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    alternative_email?: string | null;
    phone_number: string | null;
    organisation: string | null;
    terms_accepted: {
      [key: string]: boolean;
    } | null;
  };
}
