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
  /** 常數名（MUSIC_GROOVE），用來組篩選連結與推導圖示檔名 */
  categoryCode: string;
  /** 顯示用（音樂律動） */
  categoryName: string;
  /** 已是簡稱（新北） */
  city: string;
  district: string | null;
  locationName: string | null;
  /** sort_order 最小的那張，沒有圖時為 null */
  coverImageUrl: string | null;
  organizerId: number;
  organizerName: string;
}

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

/** 對應後端 CategoryResponse。code 給程式用、name 給人看 */
export interface CategoryResponse {
  code: string;
  name: string;
}
/**
 * 對應後端 CityResponse。
 * ⚠️ code 是 enum 常數名（NEW_TAIPEI），那才是 ?city= 要用的值 ——
 * EventSummaryResponse.city 送的是簡稱（「新北」），是給人看的，不能拿去查詢
 */
export interface CityResponse {
  code: string;
  name: string;
}

/** 對應後端 CommentResponse */
export interface CommentResponse {
  id: number;
  userName: string;
  rating: number;
  content: string | null;
  createdAt: string;
}

export type EventStatusCode = "DRAFT" | "PUBLISHED" | "CANCELLED";

/**
 * 對應後端 OrganizerEventSummaryResponse（主辦者後台列表用）。
 * ⚠️ 和 EventSummaryResponse 的差別：有 status（後台最需要的），
 * 沒有 organizerId / organizerName（看自己的活動不需要）
 */
export interface OrganizerEventSummaryResponse {
  id: number;
  name: string;
  status: EventStatusCode;
  startAt: string;
  endAt: string;
  categoryName: string;
  coverImageUrl: string | null;
  createdAt: string;
}

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export interface OrganizerResponse {
  id: number;
  name: string;
  introduction: string | null;
}

/** 對應後端 EventResponse（詳情用，含 description 與巢狀 organizer） */
export interface EventResponse {
  /** ⚠️ 常數名（NEW_TAIPEI）。編輯表單要用它把 select 設回原值 —— city 是顯示用簡稱 */
  cityCode: string;
  id: number;
  organizer: OrganizerResponse;
  name: string;
  description: string;
  startAt: string;
  endAt: string;
  categoryCode: string;
  categoryName: string;
  city: string;
  district: string | null;
  locationName: string | null;
  address: string | null;
  /** 依 sort_order 排序，第一張是封面 */
  imageUrls: string[];
  status: EventStatus;
  createdAt: string;
  /**
   * ⚠️ 沒有任何評論時是 null 而不是 0 ——
   * 「沒人評過」和「大家都給 0 分」是兩件事，不能顯示成「0.0 分」
   */
  ratingAverage: number | null;
  ratingCount: number;
}

export interface TicketTypeResponse {
  id: number;
  name: string;
  description: string | null;
  /** BigDecimal 序列化成 JSON number */
  price: number;
  capacity: number;
  stock: number;
  saleStartAt: string | null;
  saleEndAt: string | null;
}

export interface OrderItemResponse {
  id: number;
  ticketTypeId: number;
  /** 下單當下的快照，票種日後改名不影響這裡 */
  ticketTypeName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemResponse[];
}

/** 對應後端 PaymentInitiationResponse */
export interface PaymentInitiationResponse {
  paymentId: number;
  merchantTradeNo: string;
  /** 表單要 POST 到的網址（綠界的 AioCheckOut） */
  paymentUrl: string;
  /** 要以隱藏欄位送過去的參數。假金流閘道會是空物件 */
  formFields: Record<string, string>;
}
