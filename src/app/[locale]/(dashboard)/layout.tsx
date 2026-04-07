import { Navbar } from '@/components/layout/Navbar';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  let user: { displayName: string; avatarUrl: string | null } | null = null;

  if (supabaseUser) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
      select: { displayName: true, avatarUrl: true },
    });
    if (dbUser) {
      user = dbUser;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
