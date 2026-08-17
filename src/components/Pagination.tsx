import Link from "next/link";

/**
 * 用 <Link> 而不是按鈕：翻頁是導航，要能被複製網址、能用瀏覽器的上一頁返回。
 *
 * @param buildHref 由呼叫端決定網址怎麼組 —— /orders 與 /search 的其他 query 參數不同
 */
export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-4 py-4">
      <PageLink href={buildHref(currentPage - 1)} disabled={currentPage <= 1}>
        上一頁
      </PageLink>
      <p className="text-ink-soft">
        {currentPage} / {totalPages}
      </p>
      <PageLink
        href={buildHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        下一頁
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-ink-muted opacity-50">{children}</span>;
  }
  return (
    <Link href={href} className="text-brand-teal hover:underline">
      {children}
    </Link>
  );
}
