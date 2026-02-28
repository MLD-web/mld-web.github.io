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
