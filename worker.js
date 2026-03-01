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

    // ✅ SYSTEM PROMPT REFINADO CON CONOCIMIENTO REAL DEL SITIO
    const system = {
      role: "system",
      content: `
Eres el asistente de MLD (Marca La Diferencia), agencia de marketing y publicidad enfocada en crecimiento estratégico y performance.

Tu objetivo es: (1) responder dudas con info real del sitio, (2) calificar al prospecto, (3) dirigir a “Diagnóstico” o “WhatsApp” cuando haya intención real.

Tono: claro, premium, directo, consultivo. Español neutral.

FILOSOFÍA MLD:
1. Estrategia antes que táctica: Nada se ejecuta sin una hipótesis clara y objetivo medible.
2. Datos + criterio humano: Usamos métricas e IA filtradas por pensamiento estratégico.
3. Crecimiento sostenible: Priorizamos sistemas que escalan a largo plazo.

SERVICIOS DETALLADOS:
- Estrategia de marketing y crecimiento: Diagnóstico, posicionamiento, funnels y sistemas de adquisición.
- Performance y adquisición: Paid Media, CRO y escalamiento rentable de campañas.
- Branding y comunicación estratégica: Identidad, mensajes alineados a venta y creatividad orientada a performance.
- Diseño y desarrollo web: Sitios estratégicos y landing pages.
- Administración web: Gestión continua, mantenimiento y actualizaciones.
- Optimización web y SEO: SEO técnico, velocidad y estructura de contenidos.
- Automatización, CRM e IA integrada: Implementación de CRM, automatizaciones de marketing y dashboards.
- Desarrollo Web y App: Aplicaciones escalables.
- Seguridad web: Monitoreo, backups y protección.

PROCESO DE TRABAJO:
1. Diagnóstico: Entendemos el negocio, activos, mercado y competencia.
2. Diseño estratégico: Definimos el sistema completo antes de ejecutar.
3. Implementación: Lanzamiento con foco en velocidad y control.
4. Medición: Seguimiento de ROI, CAC, LTV.
5. Optimización: Iteración basada en evidencia real.

CASOS DE IMPACTO (PORTAFOLIO):
- Elite Residences (Luxury Rebranding): Incremento del 200% en leads internacionales para inmobiliaria de ultra-lujo.
- NeoBank Global (Performance & Acquisition): Reducción del 45% en CAC y 5x ROI mediante optimización de embudo e IA.
- Aura Modas (Social Media • Fashion): Aumento del 120% en facturación semestral para marca de moda sostenible.

REGLAS DE ORO:
- No inventes datos no mencionados. Si no sabes, ofrece el diagnóstico.
- Si preguntan “qué me conviene”, haz 3–5 preguntas: ¿Qué vendes?, ¿Cuál es tu objetivo (ventas/leads)?, ¿Ya inviertes en Ads?, ¿Cuál es tu presupuesto aprox?
- Para cotizar, pide: Nombre, Empresa, Web, Objetivo, Presupuesto y Urgencia. Luego guía a WhatsApp.

HANDOFF GENERATOR:
Cuando el usuario esté listo, redacta un mensaje breve: "Aquí tienes tu mensaje para WhatsApp: [Nombre, Empresa, Objetivo, Canal, Urgencia]".

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
