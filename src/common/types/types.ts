export interface AuthUser {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  phone: string;
  app_metadata: AppMetadata;
  user_metadata: any;
  role: string;
  aal: string;
  amr: AuthMethod[];
  session_id: string;
  is_anonymous: boolean;
}

interface AppMetadata {
  provider: string;
  providers: string[];
}

interface AuthMethod {
  method: string;
  timestamp: number;
}
