export interface Env {
  AI: Ai;
  INCIDENT_SESSION: DurableObjectNamespace;
  POSTMORTEM_WORKFLOW: Workflow; // bound in Phase 4
  ALLOWED_ORIGIN: string;
}

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin") || "";
  // Allow any preview deploy or the production Pages URL
  if (
    origin.endsWith(".incident-copilot.pages.dev") ||
    origin === "https://incident-copilot.pages.dev" ||
    origin === "http://localhost:5173" // local dev
  ) {
    return origin;
  }
  return null;
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ---- System prompt for the LLM ----
const SYSTEM_PROMPT = `You are an incident response copilot for software engineers.
When a user describes an outage, error, or suspicious behavior, respond with:

1. **Likely Diagnosis**: What is probably going wrong, ranked by likelihood.
2. **Severity Assessment**: Critical / High / Medium / Low.
3. **Prioritized Actions**: The top 3 things to do right now, numbered.
4. **Confidence**: How confident you are (high/medium/low) and why.
5. **Follow-up Questions**: What additional information would help narrow it down.

Also return a JSON block at the end fenced with \`\`\`json\`\`\` containing:
{
  "title": "short incident title",
  "severity": "critical|high|medium|low",
  "hypothesis": "one-sentence current hypothesis",
  "actions": ["action 1", "action 2", "action 3"],
  "findings": ["finding 1"]
}

Be concise, practical, and assume the user is a competent engineer.
If prior conversation context is provided, build on it — don't repeat yourself.`;

// ---- Parse structured data from LLM response ----
function parseStructuredData(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
  const origin = getAllowedOrigin(request);
  if (!origin) {
    return new Response("Forbidden", { status: 403 });
  }
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  try{
        const url = new URL(request.url);

        // ---- POST /api/chat ----
        // Main endpoint: user sends a message, gets an LLM analysis back
        if (request.method === "POST" && url.pathname === "/api/chat") {
          const { sessionId, message } = await request.json<{
            sessionId: string;
           message: string;
         }>();

         // 1. Get or create the Durable Object for this session
         const doId = env.INCIDENT_SESSION.idFromName(sessionId);
         const stub = env.INCIDENT_SESSION.get(doId);

         // 2. Save the user message to state
         await stub.fetch(new Request("https://do/message", {
         method: "POST",
            body: JSON.stringify({ role: "user", content: message }),
       }));

       // 3. Retrieve full state for context
         const stateRes = await stub.fetch(new Request("https://do/state"));
         const state = await stateRes.json();

         // 4. Build the messages array for the LLM
         const llmMessages = [
           { role: "system", content: SYSTEM_PROMPT },
           // Include conversation history (last 20 messages to stay within context)
           ...state.messages.slice(-20).map((m: any) => ({
             role: m.role,
             content: m.content,
           })),
         ];

         // 5. Call Workers AI
         const aiResponse = await env.AI.run(
           "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
           { 
            messages: llmMessages,
            max_tokens: 2048,

            }
          );

         const assistantText =
             typeof aiResponse === "string"
            ? aiResponse
            : (aiResponse as any).response ?? "";

          // 6. Save assistant response to state
          await stub.fetch(new Request("https://do/message", {
           method: "POST",
           body: JSON.stringify({ role: "assistant", content: assistantText }),
         }));

         // 7. Parse structured data and update state
         const structured = parseStructuredData(assistantText);
         if (structured) {
           await stub.fetch(new Request("https://do/update", {
             method: "POST",
             body: JSON.stringify({
               title: structured.title,
               severity: structured.severity,
               hypothesis: structured.hypothesis,
               actions: (structured.actions || []).map((a: string) => ({
               text: a,
               done: false,
              })),
              findings: structured.findings || [],
             }),
            }));
        }

        // 8. Return the response to the frontend
         return new Response(
          JSON.stringify({
            reply: assistantText,
            structured,
          }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );
        }
        
        // ---- GET /api/state?sessionId=xxx ----
        // Frontend can poll this to refresh sidebar data
        if (request.method === "GET" && url.pathname === "/api/state") {
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId) {
            return new Response("Missing sessionId", {
            status: 400,
            headers: cors,
            });
        }
        const doId = env.INCIDENT_SESSION.idFromName(sessionId);
        const stub = env.INCIDENT_SESSION.get(doId);
        const stateRes = await stub.fetch(new Request("https://do/state"));
        const state = await stateRes.json();
        return new Response(JSON.stringify(state), {
            headers: { ...cors, "Content-Type": "application/json" },
        });
        }

        // ---- POST /api/postmortem ----
        // Triggers the Workflow to generate a postmortem
        if (request.method === "POST" && url.pathname === "/api/postmortem") {
        const { sessionId } = await request.json<{ sessionId: string }>();

        // Get current state
        const doId = env.INCIDENT_SESSION.idFromName(sessionId);
        const stub = env.INCIDENT_SESSION.get(doId);
        const stateRes = await stub.fetch(new Request("https://do/state"));
        const state = await stateRes.json();

        // Kick off the workflow
        const instance = await env.POSTMORTEM_WORKFLOW.create({
            params: { state },
        });

        return new Response(
            JSON.stringify({ workflowId: instance.id }),
            { headers: { ...cors, "Content-Type": "application/json" } }
        );
        }

        // ---- GET /api/postmortem/status?id=xxx ----
        // Poll workflow status
        if (request.method === "GET" && url.pathname === "/api/postmortem/status") {
        const workflowId = url.searchParams.get("id");
        if (!workflowId) {
            return new Response("Missing id", { status: 400, headers: cors });
        }
        const instance = await env.POSTMORTEM_WORKFLOW.get(workflowId);
        const status = await instance.status();
        return new Response(JSON.stringify(status), {
            headers: { ...cors, "Content-Type": "application/json" },
        });
        }

        // ---- POST /api/action/toggle ----
        // Toggle an action item as done/undone
        if (request.method === "POST" && url.pathname === "/api/action/toggle") {
        const { sessionId, index } = await request.json<{
            sessionId: string;
            index: number;
        }>();
        const doId = env.INCIDENT_SESSION.idFromName(sessionId);
        const stub = env.INCIDENT_SESSION.get(doId);
        const stateRes = await stub.fetch(new Request("https://do/state"));
        const state: any = await stateRes.json();

        if (state.actions[index]) {
            state.actions[index].done = !state.actions[index].done;
            await stub.fetch(new Request("https://do/update", {
            method: "POST",
            body: JSON.stringify({ actions: state.actions }),
            }));
        }
        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...cors, "Content-Type": "application/json" },
        });
        }

        return new Response("Not found", { status: 404, headers: cors });
    } catch (err: any) {
      // This ensures CORS headers are always present, even on crashes
      console.error("Worker error:", err.message, err.stack);
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        }
      );
    }
  },
};