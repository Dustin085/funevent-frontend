import Link from "next/link";
import { redirect } from "next/navigation";
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
        <div className="rounded-[10px] bg-white p-10 text-center shadow-[0_0_2px_1px_rgba(0,0,0,0.3)]">
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
                className="flex flex-col gap-3 rounded-[10px] bg-white p-6 shadow-[0_0_2px_1px_rgba(0,0,0,0.3)] transition-transform duration-[350ms] hover:-translate-y-[2px]"
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

                {/* 明細摘要。後端靠 Order.orderItems 上的 @BatchSize 一次撈齊，
                    所以這裡列出 items 不會造成 1+N */}
                <p className="truncate text-[16px] text-ink-soft">
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

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4">
          <PageLink page={humanPage - 1} disabled={humanPage <= 1}>
            上一頁
          </PageLink>
          <p className="text-ink-soft">
            {humanPage} / {totalPages}
          </p>
          <PageLink page={humanPage + 1} disabled={humanPage >= totalPages}>
            下一頁
          </PageLink>
        </nav>
      )}
    </main>
  );
}

/** 用 <Link> 而不是按鈕：翻頁是導航，要能被複製網址、能用瀏覽器的上一頁返回 */
function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-ink-muted opacity-50">{children}</span>;
  }
  return (
    <Link
      href={`/orders?page=${page}`}
      className="text-brand-teal hover:underline"
    >
      {children}
    </Link>
  );
}
