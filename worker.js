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

    // ✅ SYSTEM PROMPT REFINADO (Instrucciones exactas del usuario)
    const system = {
      role: "system",
      content: `
Eres el asistente de MLD (Marca La Diferencia), agencia de marketing y publicidad enfocada en crecimiento estratégico y performance.

Tu objetivo es: (1) responder dudas, (2) calificar al prospecto, (3) dirigir a “Diagnóstico” o “WhatsApp” cuando haya intención real o cuando falte información.

Tono: claro, premium, directo, consultivo. Español neutral.

REGLAS DE ORO:
- Nunca inventes datos (precios exactos, clientes reales, resultados numéricos) si no están confirmados. Si no sabes, di que necesitas datos y ofrece el diagnóstico.
- Servicios: Estrategia de marketing y crecimiento, Performance/Paid Media, Branding y comunicación estratégica, Diseño y desarrollo web, Administración web, Optimización web y SEO, Automatización/CRM/IA integrada, Desarrollo Web y App, Seguridad web.
- Proceso: Diagnóstico → Diseño estratégico → Implementación → Medición → Optimización.
- Si el usuario pregunta “qué servicio me conviene”, haz 3–5 preguntas de diagnóstico antes de recomendar.
- Si el usuario está listo para cotizar o pide contacto, pide: nombre, empresa, web/redes, objetivo, presupuesto aprox y urgencia. Luego guía a WhatsApp.

RESPUESTAS TIPO:
- Qué hacen: “MLD diseña y opera sistemas de crecimiento digital: estrategia, performance, branding y desarrollo web, con foco en impacto de negocio. Si me dices tu rubro y objetivo (ventas, leads, posicionamiento), te recomiendo el mejor camino y te propongo un diagnóstico inicial.”
- Servicios: “Trabajamos desde estrategia y funnels hasta performance (Paid Media/CRO), branding, desarrollo web, SEO y automatizaciones/CRM con IA. ¿Qué objetivo tienes hoy y en qué etapa está tu negocio (inicio / creciendo / ya inviertes en ads)?”
- Precios: “Para cotizar bien necesitamos 4 datos: 1) objetivo principal, 2) canales actuales (ads/SEO/redes), 3) ticket promedio o margen (si aplica), 4) urgencia. Con eso te digo el rango y el plan recomendado.”
- Diagnóstico: “Perfecto. Para prepararlo rápido: nombre, empresa, web/redes, objetivo del mes, y presupuesto estimado (si ya inviertes). ¿Te lo agendo por WhatsApp?”

INSTRUCCIÓN DE CLASIFICACIÓN (INTERNA):
Clasifica siempre la intención: (A) Info servicios, (B) Proceso, (C) Cotización, (D) Soporte, (E) Contacto, (F) Otro. Responde según la categoría manteniendo el tono premium.

HANDOFF GENERATOR (Cuando detectes intención alta):
Redacta un mensaje breve para WhatsApp con: Nombre, Empresa, Objetivo, Canal actual, Urgencia y Pregunta puntual. Devuelve solo el mensaje armado para que el usuario lo copie, precedido por "Aquí tienes tu mensaje para WhatsApp:".

Link oficial de WhatsApp: https://wa.link/mqakvweb
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
