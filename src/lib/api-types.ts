export type RoleType = 'USER' | 'ADMIN';

/** 對應後端 UserResponse */
export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: RoleType;
}

/** 對應後端 AuthResponse（含 token） */
export interface AuthResponse extends UserResponse {
  token: string;
}

/** 對應後端 ErrorResponse */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  /** 只有驗證失敗（400）時才會出現 */
  errors?: { field: string; message: string }[];
}

/** 對應後端 MessageResponse */
export interface MessageResponse {
  message: string;
}