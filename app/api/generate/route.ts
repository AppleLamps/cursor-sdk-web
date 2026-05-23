import { CursorAgentError, runAgentGeneration, serializeSse } from "@/lib/cursor";
import { buildAgentPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

interface GenerateRequestBody {
  sessionId: string;
  prompt: string;
  agentId?: string;
}

export async function POST(request: Request) {
  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionId, prompt, agentId } = body;

  if (!sessionId?.trim() || !prompt?.trim()) {
    return Response.json(
      { error: "sessionId and prompt are required" },
      { status: 400 },
    );
  }

  const agentPrompt = buildAgentPrompt(sessionId.trim(), prompt.trim());

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(serializeSse(event, data)));
      };

      send("ready", { sessionId, resumed: Boolean(agentId) });

      try {
        await runAgentGeneration({
          prompt: agentPrompt,
          agentId,
          onEvent: (payload) => {
            if (payload.type === "log") {
              send("log", payload);
            } else if (payload.type === "thinking") {
              send("thinking", payload);
            } else if (payload.type === "task") {
              send("task", payload);
            } else if (payload.type === "assistant") {
              send("assistant", payload);
            } else if (payload.type === "tool") {
              send("tool", payload);
            } else if (payload.type === "status") {
              send("status", payload);
            } else if (payload.type === "done") {
              send("done", payload);
            }
          },
        });
      } catch (err) {
        if (err instanceof CursorAgentError) {
          send("error", {
            message: err.message,
            retryable: err.isRetryable,
            kind: "startup",
          });
        } else {
          send("error", {
            message: err instanceof Error ? err.message : "Unknown error",
            kind: "internal",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
