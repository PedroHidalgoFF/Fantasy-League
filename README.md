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
