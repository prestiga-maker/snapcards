'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-600">An unexpected error occurred.</p>
          {error.digest && (
            <p className="mt-1 text-xs text-gray-400">Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
