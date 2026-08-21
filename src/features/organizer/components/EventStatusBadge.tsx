import type { EventStatusCode } from "@/lib/api-types";

/** 顏色帶語意：草稿是未完成、已發布是進行中、已取消是終止 */
const STATUS_STYLE: Record<
  EventStatusCode,
  { text: string; className: string }
> = {
  DRAFT: { text: "草稿", className: "bg-brand-amber" },
  PUBLISHED: { text: "已發布", className: "bg-brand-teal" },
  CANCELLED: { text: "已取消", className: "bg-ink-muted" },
};

export function EventStatusBadge({ status }: { status: EventStatusCode }) {
  const { text, className } = STATUS_STYLE[status];
  return (
    <span
      className={`shrink-0 rounded-full px-4 py-1 text-[14px] text-white ${className}`}
    >
      {text}
    </span>
  );
}
