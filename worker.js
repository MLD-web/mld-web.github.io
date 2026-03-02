// worker.js — Cloudflare Workers AI (Llama 3 8B) + CORS
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    // Allow MLD domains and local development
    const allowedOrigins = [
      "https://mld.com.pe",
      "https://mld-web.github.io",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ];

    const isAllowedOrigin = allowedOrigins.includes(origin);
    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin ? origin : allowedOrigins[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json; charset=utf-8",
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Healthcheck
    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, provider: "cloudflare-ai", model: "llama-3-8b" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const userText = (body?.message || "").toString();

    // Acepta tanto {messages:[...]} como {message:"..."}
    const chatMessages = messages.length
      ? messages
      : userText
        ? [{ role: "user", content: userText }]
        : [];

    if (!chatMessages.length) {
      return new Response(JSON.stringify({ error: "Missing messages/message" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // System prompt (MLD Strategic Edition)
    const system = {
      role: "system",
      content:
        "Eres el Asistente de MLD (Marca La Diferencia), agencia de marketing y publicidad enfocada en crecimiento estratégico y performance. " +
        "TONO: Claro, premium, directo, consultivo. Español neutral. " +
        "OBJETIVOS: 1) Responder dudas, 2) Calificar al prospecto, 3) Dirigir a 'Diagnóstico' o 'WhatsApp' cuando haya intención real o falte información. " +
        "SERVICIOS: Estrategia, Performance/Ads, Branding, Desarrollo Web/App, SEO, Automatización/IA, Seguridad. " +
        "REGLAS: " +
        "- No inventes precios ni resultados si no están confirmados. " +
        "- Si preguntan 'qué me conviene', haz 3-5 preguntas de diagnóstico antes de recomendar. " +
        "- Si el usuario está listo para cotizar o pide contacto, ofrece WhatsApp (https://wa.link/mqakvweb) y pide: Nombre, Empresa, Web, Objetivo, Presupuesto, Urgencia. " +
        "- Si detectas intención alta de contacto, genera un mensaje breve para que el usuario lo copie al WhatsApp con sus datos (HANDOFF). " +
        "PROCESO: Diagnóstico -> Diseño estratégico -> Implementación -> Medición -> Optimización.",
    };

    // Cloudflare AI espera messages estilo chat
    const aiInput = {
      messages: [system, ...chatMessages].map((m) => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: String(m.content ?? ""),
      })),
      max_tokens: 600,
      temperature: 0.6,
    };

    try {
      // ✅ Llama 3 8B Instruct en Workers AI
      const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", aiInput);

      const reply =
        (typeof result?.response === "string" && result.response.trim()) ||
        (typeof result?.output_text === "string" && result.output_text.trim()) ||
        "";

      if (!reply) {
        return new Response(JSON.stringify({ error: "Empty model response", raw: result }), {
          status: 502,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Workers AI error",
          message: err?.message || String(err),
        }),
        { status: 502, headers: corsHeaders }
      );
    }
  },
};
