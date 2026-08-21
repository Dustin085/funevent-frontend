import Link from "next/link";
import { redirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { SectionTitle } from "@/components/SectionTitle";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { formatEventDateTime } from "@/lib/format-date";
import { SpringApiError, springGet } from "@/lib/spring";
import type { OrderResponse, PagedModel } from "@/lib/api-types";

const PAGE_SIZE = 10;

export default async function MyOrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const { page } = await searchParams;
  // 網址是 1 起算（給人看），API 是 0 起算
  const humanPage = Math.max(
    1,
    Number(Array.isArray(page) ? page[0] : page) || 1,
  );

  let orders: PagedModel<OrderResponse>;
  try {
    orders = await springGet<PagedModel<OrderResponse>>(
      `/api/orders/me?page=${humanPage - 1}&size=${PAGE_SIZE}`,
      { auth: true },
    );
  } catch (error) {
    // 沒登入時 Spring 回 401 —— 導去登入頁並帶回程路徑
    if (error instanceof SpringApiError && error.status === 401) {
      redirect(`/login?next=${encodeURIComponent("/orders")}`);
    }
    throw error;
  }

  const totalPages = Math.max(1, orders.page.totalPages);

  return (
    <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-8 sm:px-8">
      <SectionTitle title="我的訂單" />

      {orders.content.length === 0 ? (
        <div className="rounded-[10px] bg-white p-10 text-center funevent-shadow">
          <p className="text-ink-muted">還沒有任何訂單</p>
          <Link
            href="/"
            className="mt-4 inline-block text-brand-teal hover:underline"
          >
            去看看有哪些活動
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.content.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-col gap-3 rounded-[10px] bg-white p-6 funevent-shadow transition-transform duration-[350ms] hover:-translate-y-[2px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[18px] font-medium text-ink-soft">
                    訂單 #{order.id}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>

                <p className="text-[14px] text-ink-muted">
                  {formatEventDateTime(order.createdAt)}
                </p>

                {/* ⚠️ 一筆訂單可以跨活動下單，所以要去重後全部列出 ——
                    只顯示第一個活動名稱會讓使用者以為訂單只有那一場 */}
                <p className="truncate text-[16px] font-medium text-ink-soft">
                  {[...new Set(order.items.map((item) => item.eventName))].join(
                    "、",
                  )}
                </p>

                {/* 明細摘要。活動名稱與票種都靠 @BatchSize 批次載入，不會造成 1+N */}
                <p className="truncate text-[15px] text-ink-muted">
                  {order.items
                    .map((item) => `${item.ticketTypeName} × ${item.quantity}`)
                    .join("、")}
                </p>

                <p className="text-right text-[18px] font-medium text-ink-soft">
                  NT$ {order.totalAmount.toLocaleString("zh-TW")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination 自己會在只有一頁時不渲染 */}
      <Pagination
        currentPage={humanPage}
        totalPages={totalPages}
        buildHref={(p) => `/orders?page=${p}`}
      />
    </main>
  );
}
