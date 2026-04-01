import { DurableObject } from "cloudflare:workers";

interface IncidentState {
  id: string;
  title: string;
  severity: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  hypothesis: string;
  actions: { text: string; done: boolean }[];
  findings: string[];
  messages: { role: "user" | "assistant"; content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
}

function freshState(id: string): IncidentState {
  return {
    id,
    title: "New Incident",
    severity: "unknown",
    status: "investigating",
    hypothesis: "",
    actions: [],
    findings: [],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export class IncidentSession extends DurableObject {
  private state: IncidentState | null = null;

  // Lazy-load state from storage on first access
  private async getState(): Promise<IncidentState> {
    if (!this.state) {
      const stored = await this.ctx.storage.get<IncidentState>("state");
      this.state = stored ?? freshState(this.ctx.id.toString());
    }
    return this.state;
  }

  private async saveState(): Promise<void> {
    if (this.state) {
      this.state.updatedAt = Date.now();
      await this.ctx.storage.put("state", this.state);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /state — return full incident state
    if (request.method === "GET" && path === "/state") {
      const s = await this.getState();
      return Response.json(s);
    }

    // POST /message — append a user or assistant message
    if (request.method === "POST" && path === "/message") {
      const { role, content } = await request.json<{
        role: "user" | "assistant";
        content: string;
      }>();
      const s = await this.getState();
      s.messages.push({ role, content, timestamp: Date.now() });
      await this.saveState();
      return Response.json({ ok: true });
    }

    // POST /update — partial update to hypothesis, actions, findings, title, severity, status
    if (request.method === "POST" && path === "/update") {
      const patch = await request.json<Partial<IncidentState>>();
      const s = await this.getState();
      if (patch.hypothesis !== undefined) s.hypothesis = patch.hypothesis;
      if (patch.actions !== undefined) s.actions = patch.actions;
      if (patch.findings !== undefined) s.findings = patch.findings;
      if (patch.title !== undefined) s.title = patch.title;
      if (patch.severity !== undefined) s.severity = patch.severity;
      if (patch.status !== undefined) s.status = patch.status;
      await this.saveState();
      return Response.json({ ok: true });
    }

    // POST /reset — clear state for a fresh incident
    if (request.method === "POST" && path === "/reset") {
      this.state = freshState(this.ctx.id.toString());
      await this.saveState();
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch() {
    return new Response(
      "This worker only serves Durable Object requests via the API worker."
    );
  },
};