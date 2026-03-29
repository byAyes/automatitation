# Job Email Automation - GitHub Ready ✅

## Resumen del Sistema

Este sistema automatiza la búsqueda de empleo mediante:
1. **Subida de CVs** → Extrae habilidades automáticamente
2. **Actualización de perfil** → Usa los datos del CV
3. **Scraping de trabajos** → Busca ofertas en múltiples fuentes
4. **Matching con IA** → Emparea jobs con tu perfil
5. **Email semanal** → Envía las mejores oportunidades

---

## ¿Cómo funciona en GitHub?

### 1️⃣ Flujo Automático (GitHub Actions)

El workflow se ejecuta:
- **Cada lunes a las 9 AM** (automático)
- **Manualmente** desde la pestaña Actions
- **Al subir un CV** a la carpeta `cvs/`

```yaml
# .github/workflows/cv-job-processing.yml
on:
  schedule:
    - cron: '0 9 * * 1'  # Lunes 9 AM
  workflow_dispatch:      # O ejecutar manual
  push:
    paths:
      - 'cvs/**/*.pdf'   # O al subir PDF
```

### 2️⃣ Scripts de Automatización

| Script | Función |
|--------|---------|
| `process-cv-uploads.ts` | Procesa CVs subidos |
| `auto-update-profiles.ts` | Actualiza perfil desde CV |
| `scrape-jobs.ts` | Busca trabajos |
| `match-jobs.ts` | Emparea jobs con perfil |
| `send-email-digest.ts` | Envía emails |
| `cleanup-old-cvs.ts` | Limpia versiones viejas |

---

## API Endpoints

### Subir CV
```bash
POST /api/cv/upload
Content-Type: multipart/form-data

# Respuesta:
{
  "success": true,
  "version": 2,
  "cvId": "abc123"
}
```

### Obtener historial de CVs
```bash
GET /api/cv/versions?userId=1

# Respuesta:
{
  "versions": [
    { "version": 1, "fileName": "cv-v1.pdf", "createdAt": "..." },
    { "version": 2, "fileName": "cv-v2.pdf", "createdAt": "..." }
  ]
}
```

### Procesar CV (extraer skills)
```bash
POST /api/cv/process
{
  "cvId": "abc123"
}

# Respuesta:
{
  "success": true,
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [...],
  "education": [...]
}
```

### Actualizar perfil desde CV
```bash
POST /api/cv/update-profile
{
  "cvId": "abc123"
}

# Respuesta:
{
  "success": true,
  "updated": {
    "skills": ["JavaScript", "React"],
    "experienceLevel": "Mid"
  }
}
```

### Ver historial de cambios
```bash
GET /api/profile/history?userId=1

# Respuesta:
{
  "changes": [
    {
      "field": "skills",
      "oldValue": ["JavaScript"],
      "newValue": ["JavaScript", "React"],
      "source": "cv_upload",
      "timestamp": "..."
    }
  ]
}
```

---

## Configuración en GitHub

### Paso 1: Subir el código a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/job-email-automation.git
git push -u origin main
```

### Paso 2: Configurar Secrets
Ve a `Settings > Secrets and variables > Actions` y agrega:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
GMAIL_CLIENT_ID=tu-client-id
GMAIL_CLIENT_SECRET=tu-secret
GMAIL_REFRESH_TOKEN=tu-refresh-token
```

### Paso 3: Activar GitHub Actions
1. Ve a la pestaña **Actions**
2. Activa el workflow `cv-job-processing.yml`
3. Ejecútalo manualmente la primera vez

---

## Base de Datos

### Modelos agregados (Phase 6):

```prisma
// CV almacenado con versionado
model CV {
  id              String   @id @default(uuid())
  userId          String
  version         Int
  fileUrl         String
  fileName        String
  fileSize        Int
  processed       Boolean  @default(false)
  appliedToProfile Boolean @default(false)
  createdAt       DateTime @default(now())
  
  user UserProfile @relation(fields: [userId], references: [id])
}

// Historial de cambios de perfil
model ProfileChangeLog {
  id          String   @id @default(uuid())
  userId      String
  field       String   // ej: "skills", "experienceLevel"
  oldValue    String?
  newValue    String?
  source      String   // "cv_upload", "manual", "system"
  cvId        String?
  createdAt   DateTime @default(now())
  
  user UserProfile @relation(fields: [userId], references: [id])
}
```

---

## Despliegue en Vercel (Recomendado)

### 1. Conectar repositorio
```bash
vercel link
```

### 2. Configurar variables
```bash
vercel env add DATABASE_URL
vercel env add GMAIL_CLIENT_ID
# etc...
```

### 3. Deploy
```bash
vercel --prod
```

Tu API quedará en: `https://tu-proyecto.vercel.app/api/...`

---

## Estruct del Proyecto

```
job-email-automation/
├── .github/workflows/
│   └── cv-job-processing.yml    # GitHub Actions
├── scripts/
│   ├── process-cv-uploads.ts
│   ├── auto-update-profiles.ts
│   ├── scrape-jobs.ts
│   ├── match-jobs.ts
│   ├── send-email-digest.ts
│   └── cleanup-old-cvs.ts
├── src/
│   ├── app/api/
│   │   ├── cv/
│   │   │   ├── upload/route.ts
│   │   │   ├── process/route.ts
│   │   │   └── update-profile/route.ts
│   │   └── profile/history/route.ts
│   ├── lib/cv/
│   │   ├── cvParser.ts
│   │   ├── skillExtractor.ts
│   │   └── profileHistory.ts
│   └── matching/
│       └── cvMatcher.ts
├── prisma/
│   └── schema.prisma
└── .planning/phases/
    ├── 05-pdf-job-detection/   # Phase 5: PDF Upload
    └── 06-cv-database/         # Phase 6: CV Auto-Update
```

---

## Flujo Completo

```
1. Usuario sube CV (PDF)
   ↓
2. GitHub Action detecta el PDF
   ↓
3. Procesa CV → extrae skills, experiencia, educación
   ↓
4. Actualiza UserProfile automáticamente
   ↓
5. Ejecuta scraping de jobs con perfil actualizado
   ↓
6. Matching de jobs con el perfil
   ↓
7. Envía email con jobs encontrados
   ↓
8. Guarda historial de cambios
```

---

## Comandos Útiles

### Local Development
```bash
# Instalar dependencias
npm install

# Generar Prisma client
npx prisma generate

# Migrar base de datos
npx prisma migrate dev

# Correr scripts manualmente
npx ts-node scripts/process-cv-uploads.ts
npx ts-node scripts/auto-update-profiles.ts
```

### GitHub Actions
```bash
# Ejecutar workflow manualmente
gh workflow run cv-job-processing.yml

# Ver logs
gh run list
gh run view <run-id>
```

---

## Estado del Proyecto

| Fase | Estado | Descripción |
|------|--------|-------------|
| 01 | ✅ Complete | Job Board Scraper |
| 02 | ✅ Complete | AI Job Matching |
| 03 | ✅ Complete | Email Notifications |
| 04 | ✅ Complete | Automation & Scheduling |
| 05 | ✅ Complete | PDF Job Detection |
| 06 | ✅ Complete | CV Database & Auto-Update |

**Próximo Milestone:** v2.0 - Multi-user support

---

*Last updated: 2026-03-28*
