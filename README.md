# Mi Liga - Fantasy Football Site

Página que trae automáticamente power rankings y standings desde Sleeper.

## Qué hace ahora mismo

- Se conecta a la API pública de Sleeper con el ID de tu liga (`1361083494620479488`)
- Calcula Power Rankings (fórmula: 60% récord + 40% puntos a favor, normalizado 0-100)
- Muestra la tabla de Standings (récord, puntos a favor/en contra)
- Está listo para actualizarse solo 3 veces al día (6am, 12pm, 6pm hora de México)

Las demás secciones (trades, noticias, perfiles de equipo, etc.) las vamos agregando después.

## Pasos para publicarlo (sin necesidad de programar)

### 1. Subir este código a GitHub

1. Entra a github.com, dale a "New repository"
2. Nómbralo como quieras, ej. `mi-liga-fantasy`
3. Súbele estos archivos (arrastrando la carpeta completa, o usando GitHub Desktop si prefieres interfaz visual en vez de línea de comandos)

### 2. Conectar con Vercel

1. Entra a vercel.com, dale a "Add New Project"
2. Elige el repositorio que acabas de subir
3. En "Environment Variables" agrega:
   - `SLEEPER_LEAGUE_ID` = `1361083494620479488`
4. Dale "Deploy" — en 1-2 minutos tendrás tu link público (algo como `mi-liga-fantasy.vercel.app`)

### 3. Crear el Deploy Hook (para que GitHub Actions pueda re-publicar)

1. En Vercel, ve a tu proyecto → Settings → Git → Deploy Hooks
2. Créalo con nombre "rebuild-3x-dia", rama `main`
3. Copia la URL que te da (algo como `https://api.vercel.com/v1/integrations/deploy/...`)

### 4. Guardar esa URL como secreto en GitHub

1. En tu repo de GitHub, ve a Settings → Secrets and variables → Actions
2. Crea un nuevo secret llamado `VERCEL_DEPLOY_HOOK_URL` y pega ahí la URL del paso anterior

Con esto, el workflow en `.github/workflows/rebuild.yml` va a disparar un rebuild del sitio automáticamente a las 6am, 12pm y 6pm — sin que tengas que tocar nada.

## Probarlo tú mismo (opcional, si quieres ver cambios antes de subir)

Si en algún momento quieres correrlo en tu compu antes de publicar cambios, necesitarías tener Node.js instalado y correr `npm install` y luego `npm run dev` — pero para el flujo normal de "solo actualizar datos", no lo necesitas: todo pasa automático en GitHub + Vercel.

## Panel de editor (tú escribes, tú publicas)

En `/admin` hay un panel protegido por contraseña donde puedes escribir o
pegar un texto para el Reporte Semanal o el mensaje de Inicio, y publicarlo
con un clic. Es 100% gratis — no usa ningún servicio de pago.

### 1. Crear la tabla en Supabase

1. Entra a tu proyecto en supabase.com (la cuenta que ya creaste)
2. Ve a "SQL Editor" → "New query"
3. Pega el contenido completo de `supabase-setup.sql` (está en esta carpeta) y dale "Run"

### 2. Conseguir tus llaves de Supabase

1. En Supabase, ve a Settings → API
2. Copia:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **service_role key** (NO la "anon" key — necesitas la "service_role", que tiene permiso de escritura). Guárdala bien, nunca la compartas ni la subas a GitHub directamente — solo va como variable de entorno en Vercel.

### 3. Agregar las variables de entorno en Vercel

En tu proyecto de Vercel → Settings → Environment Variables, agrega:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | tu Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service_role key de Supabase |
| `ADMIN_PASSWORD` | una contraseña que tú inventes, solo para ti |

Después de agregarlas, ve a Deployments → dale "Redeploy" al último deployment para que tomen efecto.

### 4. Usarlo

Entra a `tu-sitio.vercel.app/admin`, mete tu contraseña, escribe o pega tu texto en la sección que quieras (Reporte Semanal o Inicio), y dale "Publicar". Aparece de inmediato en el sitio la próxima vez que se actualice.


