(function() {
    // Avoid double injection
    if (document.getElementById('chatbot-widget')) return;

    const WORKER_URL = "https://mld-web-chatbot.cortheygeme003.workers.dev";
    const WHATSAPP_NUMBER = "51963198424";
    const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
    const BRAND_COLOR = "#ff6600";

    const chatbotHTML = `
    <div id="chatbot-widget" class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
        <!-- Panel -->
        <div id="chatbot-panel" class="hidden w-[90vw] md:w-[400px] max-h-[600px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-float-up text-white" aria-hidden="true">
            <!-- Header -->
            <div class="bg-gradient-to-r from-black to-[#111] p-6 border-b border-white/10 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                        <div class="text-white font-bold text-lg leading-none">Asistente MLD</div>
                        <div class="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">Partner Estratégico</div>
                    </div>
                </div>
                <button id="close-chat" class="text-gray-400 hover:text-white transition p-2" type="button" aria-label="Cerrar">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Messages -->
            <div id="chatbot-messages" class="flex-1 overflow-y-auto p-6 space-y-4 min-h-[350px] scrollbar-hide flex flex-col mld-chatbot-messages">
                <div class="bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed mb-2 self-start border border-white/5">
                    Hola 👋 Soy el asistente de MLD. ¿Qué necesitas hoy: cotizar un servicio, elegir la mejor opción para tu negocio o mejorar tu presencia web?
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="p-4 flex flex-wrap gap-2 border-t border-white/5 bg-black/50 mld-quick">
                <button class="quick-action bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10" type="button" data-msg="Quiero cotizar">Quiero cotizar</button>
                <button class="quick-action bg-white/5 hover:bg-orange-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10" type="button" data-msg="¿Qué me conviene?">¿Qué me conviene?</button>
                <a class="quick-action bg-white/5 hover:bg-green-500/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-xs transition border border-white/10 flex items-center justify-center" href="${WHATSAPP_LINK}" target="_blank" rel="noopener noreferrer">WhatsApp Directo</a>
            </div>

            <!-- Input -->
            <form id="chatbot-form" class="p-4 bg-black border-t border-white/10 flex gap-2 mld-chatbot-form">
                <input type="text" id="chatbot-input" placeholder="Escribe tu consulta..." class="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-[#ff6600] transition" autocomplete="off">
                <button type="submit" class="text-white p-3 rounded-full hover:scale-110 active:scale-95 transition shadow-lg shadow-orange-500/20" style="background-color: ${BRAND_COLOR}">
                    <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </form>
        </div>

        <!-- Toggle Button -->
        <button id="chat-toggle" class="text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-110 active:scale-90 transition-all duration-300 group relative" style="background-color: ${BRAND_COLOR}" type="button" aria-label="Abrir chat">
            <i data-lucide="message-square" class="w-7 h-7 group-hover:hidden"></i>
            <i data-lucide="chevron-down" class="w-7 h-7 hidden group-hover:block"></i>
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></span>
        </button>
    </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = chatbotHTML;
    document.body.appendChild(container);

    const toggleBtn = document.getElementById("chat-toggle");
    const panel = document.getElementById("chatbot-panel");
    const closeBtn = document.getElementById("close-chat");
    const messagesEl = document.getElementById("chatbot-messages");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const quickBtns = document.querySelectorAll(".quick-action");

    if (!toggleBtn || !panel || !closeBtn || !messagesEl || !form || !input) return;

    if (window.lucide) {
        window.lucide.createIcons({ root: document.getElementById('chatbot-widget') });
    }

    let history = [
        { role: "assistant", content: "Hola 👋 Soy el asistente de MLD. ¿Qué necesitas hoy: cotizar un servicio, elegir la mejor opción para tu negocio o mejorar tu presencia web?" }
    ];

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[m]));
    }

    function addMessage(role, text) {
        const div = document.createElement("div");
        if (role === "user") {
            div.className = "text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed self-end ml-auto mb-4 border border-orange-500/20 shadow-lg shadow-orange-500/5";
            div.style.backgroundColor = "rgba(255, 102, 0, 0.15)";
            div.textContent = text;
        } else {
            div.className = "bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed mb-4 self-start border border-white/5";
            div.innerHTML = linkify(text);
        }
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (i % 2 === 1) {
                let url = part;
                // Force direct WhatsApp link for any WA variant
                if (url.includes("wa.link") || url.includes("wa.me") || url.includes("whatsapp.com")) {
                    url = WHATSAPP_LINK;
                }
                const escapedUrl = escapeHtml(url);
                let displayUrl = escapedUrl;
                if (displayUrl.length > 35) displayUrl = displayUrl.substring(0, 32) + "...";
                return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="mld-link">${displayUrl}</a>`;
            }
            return escapeHtml(part);
        }).join("");
    }

    function addWhatsAppButton(messageText, url) {
        const wrap = document.createElement("div");
        wrap.className = "bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed mb-4 self-start border border-white/5";

        const p = document.createElement("div");
        p.className = "mb-3";
        p.textContent = messageText;

        const a = document.createElement("a");
        // Always use direct link if it's WhatsApp
        const finalUrl = (url.includes("wa.link") || url.includes("wa.me") || url.includes("whatsapp.com")) ? WHATSAPP_LINK : url;
        a.href = finalUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "mld-wa-btn flex items-center justify-center gap-2 group";
        a.innerHTML = `<i data-lucide="message-circle" class="w-4 h-4"></i> <span>Abrir WhatsApp</span>`;

        wrap.appendChild(p);
        wrap.appendChild(a);
        messagesEl.appendChild(wrap);

        if (window.lucide) window.lucide.createIcons({ root: wrap });
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

    window.mldChat = { addMessage, addWhatsAppButton, openChat, closeChat };

    toggleBtn.addEventListener("click", () => {
        if (panel.classList.contains("hidden")) openChat();
        else closeChat();
    });

    closeBtn.addEventListener("click", closeChat);

    quickBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const q = btn.dataset.msg;
            if (q) sendUserMessage(q);
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = (input.value || "").trim();
        if (!text) return;
        sendUserMessage(text);
    });

    async function sendUserMessage(text) {
        input.value = "";
        openChat();
        addMessage("user", text);
        history.push({ role: "user", content: text });

        const specificContactIntent = /link|enlace|numero|número|pasar al whatsapp|dame el whatsapp/i.test(text);
        if (specificContactIntent) {
            setTimeout(() => {
                addWhatsAppButton("Aquí tienes el acceso directo a nuestro WhatsApp para agendar tu diagnóstico:", WHATSAPP_LINK);
            }, 600);
            return;
        }

        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "bg-white/5 text-gray-500 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-xs italic animate-pulse mb-4 self-start flex items-center gap-2";
        thinkingDiv.innerHTML = `<div class="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> Consultando mi cerebro estratégico...`;
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
            const responseText = await res.text();
            let data;
            try {
                data = isJson ? JSON.parse(responseText) : { reply: responseText };
            } catch (e) {
                data = { reply: responseText };
            }

            if (!res.ok) {
                const errorMsg = data?.detail || data?.error || responseText || ("HTTP " + res.status);
                throw new Error(errorMsg);
            }

            const reply = data.reply || "¿Me podrías dar un poco más de detalle sobre tu negocio?";
            const waRegex = /https?:\/\/(wa\.link|wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)[^\s)]+/g;
            const waMatch = reply.match(waRegex);

            if (waMatch) {
                const cleanText = reply.replace(waRegex, "").trim();
                addWhatsAppButton(cleanText || "Conecta con nosotros directamente:", WHATSAPP_LINK);
            } else {
                addMessage("bot", reply);
            }

            history.push({ role: "assistant", content: reply });
            if (history.length > 20) history = [history[0], ...history.slice(-19)];
        } catch (err) {
            if (thinkingDiv.parentNode) messagesEl.removeChild(thinkingDiv);
            console.error("Chatbot Error:", err);

            const errorDiv = document.createElement("div");
            errorDiv.className = "bg-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed mb-4 self-start border border-red-500/20";

            // Helpful message for the user if it's an API key error
            let userFriendlyError = escapeHtml(String(err).slice(0, 150));
            if (userFriendlyError.includes("API key")) {
                userFriendlyError = "Error de configuración: La API Key de OpenAI no está configurada correctamente en el Worker.";
            }

            errorDiv.innerHTML = `
                <p class="mb-1 text-red-400 font-bold">Error de conexión</p>
                <p class="mb-3 text-xs text-gray-400">${userFriendlyError}</p>
                <div class="flex flex-col gap-2">
                    <button onclick="location.reload()" class="bg-white/10 hover:bg-white/20 py-2 px-4 rounded-xl text-xs transition">Reintentar conexión</button>
                    <a href="${WHATSAPP_LINK}" target="_blank" class="bg-[#25D366] text-black font-bold py-2 px-4 rounded-xl text-xs text-center">Ir a WhatsApp Directo</a>
                </div>
            `;
            messagesEl.appendChild(errorDiv);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    }
})();
