# Shiftly — Gestión Horaria Empresarial

Plataforma SaaS multiempresa para gestión de turnos, horarios, solicitudes de cambio, chat y PDF.

## Stack
- **Next.js 14** (App Router + Server Actions)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL + Realtime)
- **jsPDF** (exportación PDF)

## Setup

```bash
npm install
cp .env.example .env.local  # añadir variables de entorno
npm run dev
```

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=         # URL pública del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Anon key (segura en frontend)
SUPABASE_SERVICE_ROLE_KEY=        # Service role (SOLO servidor)
```

## Login

El login usa códigos internos. El usuario introduce:
- **Código**: ej. `936`
- **Contraseña**: su contraseña

Internamente se convierte a: `936@em-fundgrube.local`

## Estructura

```
src/
  app/              → páginas y API routes (Next.js App Router)
  components/       → componentes React
    views/          → vistas por sección
    ui/             → primitivos UI reutilizables
  lib/
    supabase/       → clientes Supabase (client, server, admin)
    actions/        → Server Actions (CRUD seguro)
  types/            → tipos TypeScript
  hooks/            → hooks React personalizados
```

## Base de datos (Supabase)

Ver `supabase/schema.sql` para el esquema completo con RLS.

## Deploy

1. Subir a GitHub
2. Importar en [vercel.com](https://vercel.com)
3. Añadir variables de entorno en Vercel
4. Deploy automático
