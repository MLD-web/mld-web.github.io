# Guía de Configuración de Seguridad DNS - MLD

Para mejorar la seguridad y la reputación de los correos electrónicos de `mld.com.pe`, se recomienda implementar los siguientes registros DNS.

## 1. SPF (Sender Policy Framework)
Previene que otros envíen correos en nombre de tu dominio.

**Registro TXT para `mld.com.pe`:**
```text
v=spf1 include:_spf.google.com ~all
```
*(Nota: Ajustar si se utiliza un proveedor distinto a Google Workspace)*

## 2. DMARC (Domain-based Message Authentication, Reporting, and Conformance)
Protege contra el phishing indicando a los receptores qué hacer si falla SPF o DKIM.

**Registro TXT para `_dmarc.mld.com.pe`:**
```text
v=DMARC1; p=quarantine; rua=mailto:seguridad@mld.com.pe
```

## 3. DKIM (DomainKeys Identified Mail)
Firma digitalmente los correos salientes.

**Acción requerida:**
1. Acceder al panel de administración del correo (ej. Google Admin).
2. Generar una clave DKIM de 2048 bits.
3. Añadir el registro TXT proporcionado por el panel a la configuración DNS.

## 4. DNSSEC
Protege contra ataques de spoofing DNS (envenenamiento de caché).

**Acción requerida:**
1. Habilitar DNSSEC desde el panel de control del registrador del dominio (ej. GoDaddy, Namecheap, etc.).
2. Seguir los pasos de firma de zona proporcionados por el registrador.

## 5. MTA-STS (SMTP MTA Strict Transport Security)
Fuerza conexiones SMTP cifradas.

**Registro TXT para `_mta-sts.mld.com.pe`:**
```text
v=STSv1; id=2026022801;
```

**Registro TXT para `_smtp._tls.mld.com.pe`:**
```text
v=TLSRPTv1; rua=mailto:seguridad@mld.com.pe
```

*Nota: Requiere la publicación del archivo de política en `https://mta-sts.mld.com.pe/.well-known/mta-sts.txt`.*

---

## Seguridad Implementada en el Código

Además de las configuraciones de DNS, se han aplicado las siguientes medidas directamente en el sitio web:

### 1. Content Security Policy (CSP)
Se ha implementado una política de seguridad de contenido mediante etiquetas `<meta>` para prevenir ataques de Cross-Site Scripting (XSS) e inyección de datos. La política incluye la directiva `upgrade-insecure-requests` y permite:
- Carga de scripts desde dominios de confianza (Tailwind, Lucide, Google Analytics).
- Conexiones seguras a servicios de analítica.
- Estilos en línea necesarios para el funcionamiento de Tailwind CSS.

### 2. Referrer Policy
Configurado como `strict-origin-when-cross-origin` para proteger la privacidad del usuario al navegar hacia enlaces externos.

### 3. Permissions Policy
Restringe el acceso a funciones sensibles del navegador (cámara, micrófono, geolocalización) para mejorar la privacidad.

### 4. Divulgación de Seguridad
Se han añadido archivos estándar para la comunicación con investigadores de seguridad:
- `/.well-known/security.txt`: Información de contacto para reportar vulnerabilidades.
- `/.well-known/mta-sts.txt`: Política de seguridad de transporte de correo.

### 5. Configuración de Servidor (Headers de Seguridad)
Se han incluido archivos de configuración para los servidores más comunes para asegurar que los headers de seguridad se envíen correctamente desde el lado del servidor, incluyendo **HSTS (Strict-Transport-Security)** para forzar conexiones seguras:

- **Apache (`.htaccess`)**: Configurado con `mod_headers`.
- **Netlify (`_headers`)**: Configuración nativa de Netlify.
- **Vercel (`vercel.json`)**: Configuración nativa de Vercel.

#### Configuración para Nginx
Si el sitio se despliega en un servidor Nginx, se debe añadir lo siguiente al bloque `server` en el archivo de configuración:

```nginx
server {
    ...
    add_header Content-Security-Policy "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net; connect-src 'self' https://formspree.io https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net; object-src 'none'; base-uri 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Permissions-Policy "geolocation=(), camera=(), microphone=(), display-capture=(), payment=()" always;
    ...
}
```
