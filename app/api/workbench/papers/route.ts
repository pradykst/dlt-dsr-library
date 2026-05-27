import { NextResponse } from "next/server";
import { jsonError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("papers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ papers: data ?? [] });
  } catch (error) {
    return jsonError("Could not load papers.", 500, error instanceof Error ? error.message : String(error));
  }
}
