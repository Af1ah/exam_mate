export const dynamic = "force-dynamic";

export default async function MagicLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Open your private quiz</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Tap continue to securely open your quiz. Your link is single-use and expires in 15 minutes.
        </p>

        <form action="/api/auth/redeem" method="POST">
          <input type="hidden" name="token" value={token} />

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Continue securely
          </button>
        </form>
      </div>
    </div>
  );
}
