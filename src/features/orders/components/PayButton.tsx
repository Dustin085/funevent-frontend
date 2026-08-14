"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError, PaymentInitiationResponse } from "@/lib/api-types";

/**
 * 前往付款。
 *
 * 綠界不是「後端呼叫 API」而是「瀏覽器表單 POST」：
 * 我們先用 fetch 向 BFF 取得參數與簽章，再建一個隱藏表單真的送出去 ——
 * 使用者必須離開本站、在綠界的網域上輸入卡號。
 * 用 fetch 直接打綠界會被 CORS 擋，而且拿回來的是整頁 HTML，沒有用。
 */
export function PayButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fakeGateway, setFakeGateway] =
    useState<PaymentInitiationResponse | null>(null);

  const pay = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/orders/${orderId}`)}`);
        return;
      }
      if (!res.ok) {
        const body: ApiError = await res.json();
        // 409 = 此訂單目前無法付款（已付款、已取消）
        setError(body.message ?? "無法建立付款，請稍後再試");
        setSubmitting(false);
        return;
      }

      const initiation: PaymentInitiationResponse = await res.json();

      // 假金流閘道沒有付款頁（paymentUrl 指向 .invalid，永遠解析不了），
      // formFields 也是空的。這時不導頁，改顯示交易編號讓開發時能手動觸發回呼。
      if (Object.keys(initiation.formFields).length === 0) {
        setFakeGateway(initiation);
        return;
      }

      submitToGateway(initiation);
      // 導頁中，刻意不解除 submitting —— form.submit() 到瀏覽器真的離開頁面
      // 之間有幾百毫秒，解除的話使用者能連按兩次、建立兩筆付款單
    } catch {
      setError("無法連線到伺服器，請稍後再試");
      setSubmitting(false);
    }
  };

  if (fakeGateway) {
    return (
      <div className="flex flex-col gap-2 rounded-[10px] border-2 border-brand-amber p-4">
        <p className="font-medium text-ink-soft">
          目前使用假金流閘道，沒有真實付款頁
        </p>
        <p className="text-[14px] text-ink-muted">
          用 Postman 對 <code>/api/payments/callback</code>{" "}
          送出表單參數即可模擬付款：
        </p>
        <code className="rounded bg-[#f7f9f9] p-2 text-[14px] break-all text-ink-soft">
          merchantTradeNo={fakeGateway.merchantTradeNo}&amount=…&success=1
        </code>
        <p className="text-[14px] text-ink-muted">
          要測真金流請把後端的 <code>PAYMENT_GATEWAY</code> 設成{" "}
          <code>ecpay</code>。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="text-[16px] text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={submitting}
        className="flex h-[46px] items-center justify-center rounded-[10px] bg-brand-teal text-[18px] text-white transition-colors duration-[350ms] hover:bg-brand-teal-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "前往付款中…" : "前往付款"}
      </button>
    </div>
  );
}

/**
 * 建一個隱藏表單並送出。
 *
 * ⚠️ 用 DOM API 而不是組 HTML 字串：`input.value = v` 由瀏覽器負責轉義，
 * 自己拼字串就得處理引號與 & —— 那是注入漏洞最常見的來源之一。
 */
function submitToGateway({
  paymentUrl,
  formFields,
}: PaymentInitiationResponse) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  // 綠界收 form-urlencoded，那正是 <form> 的預設 enctype

  for (const [name, value] of Object.entries(formFields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
