import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const row = {
    correction_id: crypto.randomUUID(),
    session_id: body.session_id ?? null,
    target_type: String(body.target_type ?? "unknown"),
    target_id: String(body.target_id ?? "unknown"),
    correction_text: String(body.correction_text ?? ""),
    status: "open"
  };
  if (!row.correction_text.trim()) return NextResponse.json({ error: "Missing correction_text." }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ correction: row, persisted: false, warning: "Supabase env vars are not set." });
  }
  const { error } = await getSupabaseAdmin().from("okf_user_corrections").insert(row as never);
  if (error) return NextResponse.json({ error: "Could not save correction.", details: error.message }, { status: 500 });
  return NextResponse.json({ correction: row, persisted: true });
}
