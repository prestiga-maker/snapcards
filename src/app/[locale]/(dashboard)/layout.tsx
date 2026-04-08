import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SnapTray } from '@/components/layout/SnapTray';
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
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-lg px-4 pb-safe-nav pt-4">
        {children}
      </main>
      <SnapTray />
    </div>
  );
}
