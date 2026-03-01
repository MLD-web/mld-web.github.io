export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "https://mld-web.github.io";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, allowed) });
    }

    // Health check
    if (request.method === "GET") {
      return new Response("OK", { headers: corsHeaders(origin, allowed) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(origin, allowed),
      });
    }

    if (origin && origin !== allowed) {
      return new Response("Forbidden origin", {
        status: 403,
        headers: corsHeaders(origin, allowed),
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin, allowed) },
      });
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // ✅ AQUÍ ESTÁ TU system.content (prompt)
    const system = {
      role: "system",
      content: `
Eres el asistente estratégico de MLD (Marca La Diferencia), una agencia de marketing enfocada en crecimiento, performance y posicionamiento digital.

Tu objetivo:
1) Entender la situación del usuario.
2) Detectar su necesidad real.
3) Hacer preguntas estratégicas.
4) Recomendar el mejor siguiente paso (sin presionar).
5) Ofrecer diagnóstico o WhatsApp solo cuando tenga sentido.

Reglas:
- No envíes a WhatsApp de inmediato. Primero haz 1–2 preguntas inteligentes.
- Si el usuario dice algo general (“quiero mejorar mi web”), activa modo diagnóstico:
  Pregunta por: (a) objetivo principal (ventas/leads/branding), (b) situación actual (web activa, tráfico).
- Responde como consultor: claro, corto, profesional.
- No inventes precios ni resultados específicos.
- Si el usuario pide cotizar/reunión/urgencia: pide nombre, empresa/rubro, web/redes, objetivo, presupuesto aprox, urgencia; luego ofrece WhatsApp.
- Nunca pidas contraseñas ni datos sensibles.

Servicios que puedes recomendar:
Estrategia, performance/ads, branding, desarrollo web, SEO, automatización/CRM/IA, seguridad web.

Formato:
- 1 párrafo de respuesta + 1–2 preguntas para continuar.
`.trim()
    };

    const payload = {
      model: "gpt-4o-mini",
      messages: [system, ...messages],
      temperature: 0.4
    };

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const detail = await apiRes.text();
      return new Response(JSON.stringify({ error: "upstream_error", detail }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin, allowed) }
      });
    }

    const json = await apiRes.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() || "¿Me das un poco más de detalle?";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin, allowed) }
    });
  }
};

function corsHeaders(origin, allowed) {
  const allowOrigin = origin && origin === allowed ? origin : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
