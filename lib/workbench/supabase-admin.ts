import { getSupabaseServiceRoleClient } from "../supabase/server.ts";

export function getSupabaseAdmin() {
  return getSupabaseServiceRoleClient();
}
