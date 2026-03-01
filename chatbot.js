(function() {
    const WORKER_URL = "https://mld-web-chatbot.cortheygeme003.workers.dev";
    const WHATSAPP_NUMBER = "51963198424";
    const BRAND_COLOR = "#ff6600";

    const SYSTEM_PROMPT = `Eres el asistente de MLD (Marca La Diferencia), agencia de marketing y publicidad enfocada en crecimiento estratégico y performance.
Tu objetivo es: (1) responder dudas, (2) calificar al prospecto, (3) dirigir a “Diagnóstico” o “WhatsApp” cuando haya intención real o cuando falte información.
Tono: claro, premium, directo, consultivo. Español neutral.
Nunca inventes datos (precios exactos, clientes reales, resultados numéricos) si no están confirmados. Si no sabes, di que necesitas datos y ofrece el diagnóstico.
Servicios que puedes mencionar: Estrategia de marketing y crecimiento, Performance/Paid Media, Branding y comunicación estratégica, Diseño y desarrollo web, Administración web, Optimización web y SEO, Automatización/CRM/IA integrada, Desarrollo Web y App, Seguridad web.
Proceso: Diagnóstico → Diseño estratégico → Implementación → Medición → Optimización.
Si el usuario pide contacto inmediato, ofrece WhatsApp Directo y pedir: nombre, empresa, web/redes, objetivo, presupuesto aproximado, urgencia.
Si el usuario pregunta “qué servicio me conviene”, haz 3–5 preguntas de diagnóstico antes de recomendar.
Si el usuario está listo para cotizar, guía al formulario o WhatsApp.
Política de seguridad: no solicites contraseñas ni datos sensibles.`;

    const chatbotHTML = `
    <div id="chatbot-widget" class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
        <!-- Panel -->
        <div id="chatbot-panel" class="hidden w-[90vw] md:w-[400px] max-h-[600px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-float-up text-white">
            <!-- Header -->
            <div class="bg-gradient-to-r from-black to-[#111] p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h3 class="text-white font-bold text-lg">Asistente MLD</h3>
                    <p class="text-gray-400 text-xs">Resuelvo dudas y te guío al diagnóstico</p>
                </div>
                <button id="close-chat" class="text-gray-400 hover:text-white transition">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Messages -->
            <div id="chatbot-messages" class="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] scrollbar-hide">
                <div class="bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed">
                    Hola 👋 Soy el asistente de MLD. ¿Qué necesitas: cotizar, elegir servicio o mejorar tu web?
                </div>
            </div>

            <!-- Quick Actions -->
            <div id="chatbot-actions" class="p-4 flex flex-wrap gap-2 border-t border-white/5">
                <button class="quick-action bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10" data-msg="Quiero cotizar un servicio">Quiero cotizar</button>
                <button class="quick-action bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10" data-msg="¿Qué servicio me conviene?">¿Qué me conviene?</button>
                <button class="quick-action bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10" data-msg="Hablar por WhatsApp">WhatsApp</button>
            </div>

            <!-- Input -->
            <form id="chatbot-form" class="p-4 bg-black border-t border-white/10 flex gap-2">
                <input type="text" id="chatbot-input" placeholder="Escribe tu duda..." class="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-[#ff6600] transition">
                <button type="submit" class="text-white p-2 rounded-full hover:scale-105 transition" style="background-color: ${BRAND_COLOR}">
                    <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </form>
        </div>

        <!-- Toggle Button -->
        <button id="chat-toggle" class="text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform duration-300 group" style="background-color: ${BRAND_COLOR}">
            <i data-lucide="message-square" class="w-7 h-7 group-hover:hidden"></i>
            <i data-lucide="chevron-down" class="w-7 h-7 hidden group-hover:block"></i>
        </button>
    </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = chatbotHTML;
    document.body.appendChild(container);

    if (window.lucide) {
        window.lucide.createIcons({
            root: document.getElementById('chatbot-widget')
        });
    }

    const toggleBtn = document.getElementById("chat-toggle");
    const panel = document.getElementById("chatbot-panel");
    const closeBtn = document.getElementById("close-chat");
    const messagesEl = document.getElementById("chatbot-messages");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const quickBtns = document.querySelectorAll(".quick-action");

    let history = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "assistant", content: "Hola 👋 Soy el asistente de MLD. ¿Qué necesitas: cotizar, elegir servicio o mejorar tu web?" }
    ];

    function addMessage(role, text) {
        const div = document.createElement("div");
        if (role === "user") {
            div.className = "text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed self-end ml-auto";
            div.style.backgroundColor = "rgba(255, 102, 0, 0.15)";
            div.style.border = "1px solid rgba(255, 102, 0, 0.2)";
        } else {
            div.className = "bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-relaxed";
        }
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function openChat() {
        panel.classList.remove("hidden");
        panel.setAttribute("aria-hidden", "false");
    }

    function closeChat() {
        panel.classList.add("hidden");
        panel.setAttribute("aria-hidden", "true");
    }

    toggleBtn?.addEventListener("click", () => {
        if (panel.classList.contains("hidden")) openChat();
        else closeChat();
    });

    closeBtn?.addEventListener("click", closeChat);

    quickBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const q = btn.dataset.msg;
            if (q) sendUserMessage(q);
        });
    });

    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = (input?.value || "").trim();
        if (!text) return;
        sendUserMessage(text);
    });

    async function sendUserMessage(text) {
        if (input) input.value = "";
        openChat();
        addMessage("user", text);
        history.push({ role: "user", content: text });

        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "bg-white/5 text-gray-400 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm italic animate-pulse";
        thinkingDiv.textContent = "Pensando...";
        messagesEl.appendChild(thinkingDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const res = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history })
            });

            if (thinkingDiv.parentNode) messagesEl.removeChild(thinkingDiv);

            const isJson = (res.headers.get("content-type") || "").includes("application/json");
            const data = isJson ? await res.json() : { reply: await res.text() };

            if (!res.ok) throw new Error(data?.detail || "HTTP " + res.status);

            addMessage("bot", data.reply || "¿Me das un poco más de detalle?");
            history.push({ role: "assistant", content: data.reply });

            if (history.length > 20) history = [history[0], ...history.slice(-19)];
        } catch (err) {
            if (thinkingDiv.parentNode) messagesEl.removeChild(thinkingDiv);
            addMessage("bot", `Ahora mismo no puedo responder. Por favor, escríbenos directamente por WhatsApp: https://wa.me/${WHATSAPP_NUMBER}`);
        }
    }
})();
