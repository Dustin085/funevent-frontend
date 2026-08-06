import { getCurrentUser } from "@/lib/get-current-user";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      {user ? (
        <div className="text-center">
          <p className="text-2xl font-bold text-ink">歡迎回來，{user.name}</p>
          <p className="mt-2 text-ink-soft">
            {user.email}（{user.role}）
          </p>
        </div>
      ) : (
        <p className="text-ink-soft">請由右上角的「註冊/登入」開始</p>
      )}
    </main>
  );
}
