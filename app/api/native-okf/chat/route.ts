import "server-only";

import { handlePublicNativeOkfChat } from "../../../../src/native-okf/server/public-chat.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handlePublicNativeOkfChat(request);
}
