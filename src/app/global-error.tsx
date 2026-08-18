"use client";

/**
 * layout.tsx 出錯時唯一的防線 —— app/error.tsx 攔不到同層 layout 的錯誤。
 *
 * ⚠️ 它會「取代整個 root layout」，所以必須自己渲染 <html> 與 <body>。
 * ⚠️ 也因此不能假設任何東西存在：字型變數沒有、globals.css 不保證載入，
 *    所以這裡一律用 inline style，不用 Tailwind class。
 *
 * 這頁應該幾乎不會被看到 —— 如果常看到，代表 layout 有東西該加防護
 *（例如 getCurrentUser 在後端連不上時該回 null 而不是拋錯）。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-TW">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#f7f9f9",
          color: "#3e3a39",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 500 }}>
            網站暫時無法使用
          </h1>
          <p style={{ color: "#8a8a8a", marginTop: "0.75rem" }}>
            請稍後再試一次。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "12px 24px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#ff9d46",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            重新載入
          </button>
          {error.digest && (
            <p style={{ marginTop: "1rem", fontSize: "12px", color: "#8a8a8a" }}>
              錯誤代碼：{error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
