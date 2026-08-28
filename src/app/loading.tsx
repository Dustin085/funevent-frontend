/**
 * 根層級的 loading。涵蓋「首次載入／整頁重新載入」時的所有頁面。
 *
 * ⚠️ <b>它不涵蓋 client 端的路由跳轉</b>，這點非常容易誤解。
 *
 * 原因：這個 loading.tsx 產生的 Suspense 邊界，是掛在根 layout 的 {@code children}
 * 上的。而 &lt;Link&gt; 造成的 client 端跳轉<b>不會重新渲染根 layout</b> ——
 * 它是「沒有變動的共用部分」，那個邊界早就已經 resolve，不會再次 suspend。
 * Next 只有在「**新掛載**的 Suspense 邊界」出現在共用 layout 與變動的 segment 之間時
 * 才會顯示 fallback。
 *
 * 結果就是：從 /organizer/events 點進 /organizer/events/1 時，舊頁面會直接停在畫面上
 * 等新資料，完全沒有載入提示 —— 而且開發時「首次載入看得到轉場動畫」會讓人
 * 誤以為它有在運作。
 *
 * ⭐ 所以每個「會被獨立跳轉到」的 segment 都要有自己的 loading.tsx。
 * 它們全部是一行 re-export，畫面只維護 {@link PageLoading} 這一份。
 *
 * ⚠️ 加新路由時記得一起加 loading.tsx —— 漏掉不會報錯，
 * 只會讓那一頁在跳轉時安靜地沒有載入提示。
 */
export { PageLoading as default } from "@/components/PageLoading";
