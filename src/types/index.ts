export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'apoderado' | 'operario';
}

export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}
