import { createAssistantHandler } from "@/lib/assistant-server";

export const runtime = "nodejs";
export const POST = createAssistantHandler(fetch);
