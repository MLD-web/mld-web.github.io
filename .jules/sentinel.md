# Sentinel Security Journal 🛡️

## 2026-03-01 - [Multi-Platform Security Header Synchronization]
**Vulnerabilidad:** Inconsistencia o ausencia de cabeceras de seguridad críticas (HSTS, CSP) en diferentes entornos de despliegue (Apache, Netlify, Vercel).
**Aprendizaje:** En proyectos estáticos multiplataforma, la seguridad no puede depender solo de etiquetas `<meta>`, ya que cabeceras como `Strict-Transport-Security`, `X-Frame-Options` y `X-Content-Type-Options` requieren configuración a nivel de servidor para ser efectivas. La duplicidad de estas reglas en `.htaccess`, `_headers` y `vercel.json` aumenta el riesgo de desincronización.
**Aprendizaje Adicional:** Un `RewriteCond` huérfano en Apache (sin un `RewriteRule` inmediatamente después) provoca errores 500 que pueden dejar el sitio inaccesible. Siempre debe cerrarse con una regla (ej. `RewriteRule ^ - [L]`).
**Prevención:** Implementar un proceso de auditoría que verifique la paridad de las políticas de seguridad en todos los archivos de configuración del servidor y validar la sintaxis de Apache antes de cada despliegue.
