import type { OrderStatus } from "@/lib/api-types";

/** 顏色帶語意：待付款要行動、已付款是完成、取消／退款是終止 */
const STATUS_STYLE: Record<OrderStatus, { text: string; className: string }> = {
  PENDING: { text: "待付款", className: "bg-brand-amber" },
  PAID: { text: "已付款", className: "bg-brand-teal" },
  CANCELLED: { text: "已取消", className: "bg-ink-muted" },
  REFUNDED: { text: "已退款", className: "bg-ink-muted" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { text, className } = STATUS_STYLE[status];
  return (
    <span
      className={`shrink-0 rounded-full px-4 py-1 text-[14px] text-white ${className}`}
    >
      {text}
    </span>
  );
}
