export type RoleType = "USER" | "ADMIN";

/** 對應後端 UserResponse */
export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: RoleType;
}

/** 對應後端 AuthResponse（含 token） */
export interface AuthResponse extends UserResponse {
  accessToken: string; // 15 分鐘
  refreshToken: string; // 7 天
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

/**
 * 對應 Spring Data 的 PagedModel。
 *
 * 後端刻意包成 PagedModel 而不是直接回傳 Page —— 後者的 JSON 結構
 * 等於暴露 Spring Data 的內部實作，升版時欄位可能改變。
 */
export interface PagedModel<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** 對應後端 EventSummaryResponse（列表用的精簡版，不含 description） */
export interface EventSummaryResponse {
  id: number;
  name: string;
  /** ISO-8601，例如 2026-09-12T02:00:00Z */
  startAt: string;
  endAt: string;
  locationName: string | null;
  organizerId: number;
  organizerName: string;
}
