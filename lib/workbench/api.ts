import { NextResponse } from "next/server";
import { editableFields } from "@/lib/workbench/schema";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function readableError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint, record.code].filter(Boolean).join(" ");
  }
  return String(error);
}

export function assertAdminSecret(value: unknown) {
  if (!process.env.ADMIN_SECRET || value !== process.env.ADMIN_SECRET) {
    return false;
  }
  return true;
}

export async function upsertByKey<T extends Record<string, unknown>>(
  table: string,
  row: T,
  keys: string[]
) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from(table).select("id").limit(1);
  for (const key of keys) {
    query = query.eq(key, row[key] as string);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${table} lookup failed: ${readableError(error)}`);
  if (data?.id) {
    const { error: updateError } = await supabase.from(table).update(row as never).eq("id", data.id);
    if (updateError) throw new Error(`${table} update failed: ${readableError(updateError)}`);
    return;
  }
  const { error: insertError } = await supabase.from(table).insert(row as never);
  if (insertError) throw new Error(`${table} insert failed: ${readableError(insertError)}`);
}

export function isEditableField(table: string, field: string) {
  if (!(table in editableFields)) return false;
  return (editableFields[table as keyof typeof editableFields] as readonly string[]).includes(field);
}

export function coerceDecisionValue(value: string, field: string) {
  if (["year", "overall_confidence", "confidence", "evidence_strength", "display_order"].includes(field)) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (["diagram_include", "main_diagram_include", "extended_diagram_include"].includes(field)) {
    return ["true", "yes", "1"].includes(value.toLowerCase());
  }
  return value;
}
