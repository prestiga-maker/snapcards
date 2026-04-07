import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white text-gray-900 antialiased">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-indigo-600">404</h1>
          <p className="mt-4 text-xl font-semibold">Page not found</p>
          <p className="mt-2 text-gray-500">The page you are looking for does not exist.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
