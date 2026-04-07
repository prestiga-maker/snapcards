import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * Get the authenticated user's MySQL record from the Supabase JWT.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseUid: supabaseUser.id },
  });

  return user;
}

/**
 * Require authentication — throws 401 JSON response if not authenticated.
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
