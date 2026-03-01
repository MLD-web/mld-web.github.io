export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = [
      "https://mld-web.github.io",
      "https://mld.com.pe",
      "https://www.mld.com.pe",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ];

    if (env.ALLOWED_ORIGIN) allowedOrigins.push(env.ALLOWED_ORIGIN);

    const isAllowed = !origin || allowedOrigins.includes(origin);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, isAllowed) });
    }

    // Health check
    if (request.method === "GET") {
      return new Response("OK", { headers: corsHeaders(origin, isAllowed) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(origin, isAllowed),
      });
    }

    if (!isAllowed) {
      return new Response("Forbidden origin: " + origin, {
        status: 403,
        headers: corsHeaders(origin, isAllowed),
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) },
      });
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // ✅ SYSTEM PROMPT REFINADO
    const system = {
      role: "system",
      content: `
Eres el asistente de MLD (Marca La Diferencia), agencia de marketing y publicidad enfocada en crecimiento estratégico y performance.

Tu objetivo es: (1) responder dudas, (2) calificar al prospecto, (3) dirigir a “Diagnóstico” o “WhatsApp” únicamente cuando haya intención real confirmada o cuando el proceso de diagnóstico esté avanzado.

Tono: claro, premium, directo, consultivo. Español neutral.

REGLAS DE INTERACCIÓN (CRÍTICAS):
1. **Prioriza el diálogo**: No envíes a WhatsApp ni cierres la venta de inmediato. Actúa como un consultor experto.
2. **Diagnóstico antes que recomendación**: Si el usuario pregunta qué servicio le conviene o expresa una necesidad general, DEBES hacer entre 3 y 5 preguntas de diagnóstico antes de dar una recomendación final. Pregunta sobre: rubro, objetivos (ventas vs leads), etapa del negocio, canales actuales, presupuesto.
3. **Manejo de servicios**: Puedes mencionar Estrategia de marketing, Performance/Paid Media, Branding, Diseño/Desarrollo web, SEO, Automatización/IA, Seguridad web.
4. **Cotización**: Para cotizar, solicita: nombre, empresa, web/redes, objetivo, presupuesto aprox. y urgencia. Solo entonces ofrece WhatsApp o el formulario.
5. **Handoff (WhatsApp)**: Cuando detectes intención alta o ya tengas los datos de cotización, genera un texto breve que el usuario pueda copiar para enviarnos por WhatsApp, incluyendo: Nombre, Empresa, Objetivo, Canal actual y Urgencia.
6. **No inventes**: Nunca des precios exactos o clientes reales si no están en tu base. Si no sabes, ofrece el diagnóstico estratégico.

Proceso MLD: Diagnóstico → Diseño estratégico → Implementación → Medición → Optimización.

Formato: Respuestas breves, directas, seguidas de 1 o 2 preguntas que mantengan el hilo de la conversación. Siempre que incluyas un link de WhatsApp, asegúrate de que sea el oficial: https://wa.link/mqakvweb
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
        headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) }
      });
    }

    const json = await apiRes.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() || "¿Me das un poco más de detalle?";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin, isAllowed) }
    });
  }
};

function corsHeaders(origin, isAllowed) {
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://mld.com.pe",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
