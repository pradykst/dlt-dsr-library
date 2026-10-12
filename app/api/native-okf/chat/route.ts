import "server-only";

import { handlePublicNativeOkfChat } from "../../../../src/native-okf/server/public-chat.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Includes synthesis, its single validation repair, and bounded quality review.
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  return handlePublicNativeOkfChat(request);
}
