import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatEventDateTime } from "@/lib/format-date";
import { getCurrentOrganizer } from "@/lib/get-current-organizer";
import { getCurrentUser } from "@/lib/get-current-user";
import { firstValue } from "@/lib/search-params";
import { SpringApiError, springGet } from "@/lib/spring";
import type {
  EventOrderItemResponse,
  EventSalesSummary,
  OrderStatus,
  PagedModel,
} from "@/lib/api-types";

const PAGE_SIZE = 20;

const STATUS_TABS: { code: OrderStatus | null; label: string }[] = [
  { code: null, label: "全部" },
  { code: "PENDING", label: "待付款" },
  { code: "PAID", label: "已付款" },
  { code: "CANCELLED", label: "已取消" },
];

export default async function EventOrdersPage({
  params,
  searchParams,
}: PageProps<"/organizer/events/[id]/orders">) {
  const { id } = await params;
  const { status, page } = await searchParams;
  const humanPage = Math.max(1, Number(firstValue(page)) || 1);

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/organizer/events/${id}/orders`)}`,
    );
  }
  const organizer = await getCurrentOrganizer();
  if (!organizer) redirect("/organizer/setup");

  const requested = firstValue(status);
  const activeStatus =
    STATUS_TABS.find((tab) => tab.code === requested)?.code ?? null;

  const query = new URLSearchParams({
    page: String(humanPage - 1),
    size: String(PAGE_SIZE),
  });
  if (activeStatus) query.set("status", activeStatus);

  let orders: PagedModel<EventOrderItemResponse>;
  let summary: EventSalesSummary;
  try {
    [orders, summary] = await Promise.all([
      springGet<PagedModel<EventOrderItemResponse>>(
        `/api/organizers/me/events/${id}/orders?${query}`,
        { auth: true },
      ),
      springGet<EventSalesSummary>(
        `/api/organizers/me/events/${id}/sales-summary`,
        { auth: true },
      ),
    ]);
  } catch (error) {
    // 404 = 不存在或是別人的草稿；403 = 別人已發布的活動
    if (
      error instanceof SpringApiError &&
      (error.status === 404 || error.status === 403)
    ) {
      notFound();
    }
    throw error;
  }

  const tabHref = (code: OrderStatus | null) =>
    code
      ? `/organizer/events/${id}/orders?status=${code}`
      : `/organizer/events/${id}/orders`;

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <Link
          href={`/organizer/events/${id}`}
          className="text-[14px] text-ink-muted transition-colors duration-[350ms] hover:text-brand"
        >
          ← 回到活動
        </Link>
        <h1 className="mt-2 text-[24px] font-medium text-ink-soft sm:text-[28px]">
          {summary.eventName}・訂單
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="已售出" value={`${summary.paidQuantity} 張`} />
        <SummaryCard
          label="銷售金額"
          value={`NT$ ${summary.paidAmount.toLocaleString("zh-TW")}`}
        />
        <SummaryCard
          label="待付款"
          value={`${summary.pendingQuantity} 張`}
          // ⚠️ 這些票的庫存正被佔用但錢還沒進來。逾時後會自動取消並回補 ——
          // 不講清楚的話主辦者會以為「剩餘張數」就是實際還能賣的數量
          hint="庫存佔用中，逾時會自動釋出"
        />
      </div>

      <nav aria-label="訂單狀態篩選">
        <ul className="flex flex-wrap gap-4">
          {STATUS_TABS.map((tab) => {
            const active = tab.code === activeStatus;
            return (
              <li key={tab.label}>
                <Link
                  href={tabHref(tab.code)}
                  aria-current={active ? "page" : undefined}
                  className={`text-[16px] transition-colors duration-[350ms] hover:text-brand ${
                    active ? "font-bold text-brand" : "text-ink-soft"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {orders.content.length === 0 ? (
        <div className="rounded-[10px] bg-white p-12 text-center funevent-shadow">
          <p className="text-ink-muted">
            {activeStatus ? "這個狀態下沒有訂單" : "還沒有任何訂單"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.content.map((item) => (
            <li
              key={item.orderItemId}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] bg-white px-4 py-3 funevent-shadow"
            >
              <p className="text-[14px] text-ink-muted">#{item.orderId}</p>
              <p className="min-w-[6ch] font-medium text-ink-soft">
                {item.buyerName}
              </p>
              <p className="min-w-0 flex-1 truncate text-[15px] text-ink-soft">
                {item.ticketTypeName} × {item.quantity}
              </p>
              <p className="text-[16px] font-bold text-brand-amber">
                NT$ {item.subtotal.toLocaleString("zh-TW")}
              </p>
              <OrderStatusBadge status={item.orderStatus} />
              <p className="text-[14px] text-ink-muted">
                {formatEventDateTime(item.orderedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        currentPage={humanPage}
        totalPages={Math.max(1, orders.page.totalPages)}
        buildHref={(p) =>
          activeStatus
            ? `/organizer/events/${id}/orders?status=${activeStatus}&page=${p}`
            : `/organizer/events/${id}/orders?page=${p}`
        }
      />
    </main>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[10px] bg-white p-5 funevent-shadow">
      <p className="text-[14px] text-ink-muted">{label}</p>
      <p className="mt-1 text-[24px] font-medium text-ink-soft">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}
    </div>
  );
}
