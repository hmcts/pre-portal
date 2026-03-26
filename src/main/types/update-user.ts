import { AccessStatus } from './access-status';
import { UserProfile } from './user-profile'; // Adjust import path as needed

export class UpdateUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  organisation: string | null;
  alternative_email: string | null;
  app_access: {
    id: string;
    active: boolean;
    court_id: string;
    default_court: boolean;
    last_active: string | null;
    role_id: string;
    user_id: string;
  }[];
  portal_access: {
    id: string;
    invited_at: string;
    last_access: string | null;
    registered_at: string | null;
    status: AccessStatus;
  }[];

  constructor(data: UpdateUser) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.phone_number = data.phone_number;
    this.organisation = data.organisation;
    this.alternative_email = data.alternative_email;
    this.app_access = data.app_access;
    this.portal_access = data.portal_access;
  }

  static fromUserProfile(profile: UserProfile): UpdateUser {
    return new UpdateUser({
      id: profile.user.id,
      first_name: profile.user.first_name,
      last_name: profile.user.last_name,
      email: profile.user.email,
      phone_number: profile.user.phone_number,
      organisation: profile.user.organisation,
      alternative_email: profile.user.alternative_email,
      app_access: profile.app_access.map(a => ({
        id: a.id,
        active: a.active,
        court_id: a.court.id,
        default_court: a.active,
        last_active: a.last_access,
        role_id: a.role.id,
        user_id: profile.user.id,
      })),
      portal_access: profile.portal_access.map(p => ({
        id: p.id,
        invited_at: p.invited_at,
        last_access: p.last_access,
        registered_at: p.registered_at,
        status: p.status,
      })),
    });
  }
}
