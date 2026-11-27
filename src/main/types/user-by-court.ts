export interface UserBasicAccessInfo {
  access: {
    court_id: string;
    last_access: string;
    role_name: string;
    active: boolean;
  };
  first_name: string;
  last_name: string;
  email: string;
  user_id: string;
}
