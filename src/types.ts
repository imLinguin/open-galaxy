export interface MessageToClient {
  Command: string;
  Arguments: any;
}

export interface GOGCredential {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  session_id: string;
  refresh_token: string;
  user_id: string;
  loginTime: number;
}
