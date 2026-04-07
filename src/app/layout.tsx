import './globals.css';

// Root layout — locale-specific layout is in [locale]/layout.tsx
// This bare layout is required by Next.js App Router
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
