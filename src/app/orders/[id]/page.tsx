import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PayButton } from "@/features/orders/components/PayButton";
import { formatEventDateTime } from "@/lib/format-date";
import { SpringApiError, springGet } from "@/lib/spring";
import type { OrderResponse } from "@/lib/api-types";

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;

  let order: OrderResponse;
  try {
    // 需要登入才看得到，所以帶 token。別人的訂單後端一律回 404 ——
    // 訂單是私有資源，403 等於證實了這個 id 存在
    order = await springGet<OrderResponse>(`/api/orders/${id}`, { auth: true });
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-8 sm:px-8">
      <Link href="/orders" className="text-brand-teal hover:underline">
        ← 回我的訂單
      </Link>

      <section className="flex flex-col gap-5 rounded-[10px] bg-white p-8 funevent-shadow">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[28px] font-medium text-ink-soft">
            訂單 #{order.id}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-ink-muted">
          建立時間：{formatEventDateTime(order.createdAt)}
        </p>

        <div className="h-px w-full bg-[#d9d9d9]" />

        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-[18px] text-ink-soft">
                  {item.ticketTypeName}
                </p>
                <p className="text-[16px] text-ink-muted">
                  NT$ {item.unitPrice.toLocaleString("zh-TW")} × {item.quantity}
                </p>
              </div>
              <p className="text-[18px] text-ink-soft">
                NT$ {item.subtotal.toLocaleString("zh-TW")}
              </p>
            </li>
          ))}
        </ul>

        <div className="h-px w-full bg-[#d9d9d9]" />

        <div className="flex items-center justify-between">
          <p className="text-[20px] font-medium text-ink-soft">總金額</p>
          <p className="text-[20px] font-medium text-ink-soft">
            NT$ {order.totalAmount.toLocaleString("zh-TW")}
          </p>
        </div>

        {order.status === "PENDING" ? (
          <PayButton orderId={order.id} />
        ) : (
          <p className="text-[16px] text-ink-muted">
            {order.status === "PAID"
              ? "這筆訂單已完成付款"
              : "這筆訂單已無法付款"}
          </p>
        )}
      </section>
    </main>
  );
}
