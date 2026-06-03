import { NextResponse } from "next/server";
import { assertAdminSecret, jsonError, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const adminSecret = request.headers.get("x-admin-secret") ?? url.searchParams.get("adminSecret");
    if (!assertAdminSecret(adminSecret)) return jsonError("Unauthorized.", 401);

    const { data, error, count } = await getSupabaseAdmin()
      .from("desrist_evaluation_responses")
      .select("improvement_priorities", { count: "exact" });
    if (error) throw error;

    const votes = new Map<string, number>();
    for (const row of data ?? []) {
      const priorities = Array.isArray(row.improvement_priorities) ? row.improvement_priorities : [];
      for (const priority of priorities) {
        if (typeof priority === "string") votes.set(priority, (votes.get(priority) ?? 0) + 1);
      }
    }

    const priorities = [...votes.entries()]
      .map(([priority, voteCount]) => ({ priority, votes: voteCount }))
      .sort((a, b) => b.votes - a.votes || a.priority.localeCompare(b.priority));

    return NextResponse.json({ priorities, responseCount: count ?? 0 });
  } catch (error) {
    return jsonError("Could not load evaluation priorities.", 500, readableError(error));
  }
}
