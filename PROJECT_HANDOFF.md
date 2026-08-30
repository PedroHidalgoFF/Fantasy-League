# RedZone Redemption — Estado del Proyecto (handoff)

Pega este archivo al inicio de un chat nuevo con Claude para retomar el
proyecto sin tener que re-explicar todo desde cero.

## Qué es

Sitio web (Next.js 14, App Router) para una liga de fantasy football en
Sleeper. Multi-liga: cualquier visitante puede configurar SU propia liga en
`/setup` (username o ID de Sleeper + elegir su equipo), guardado en cookies.
Desplegado en Vercel, código en GitHub, actualización automática vía
GitHub Actions (cron que golpea un Deploy Hook de Vercel).

## Stack

- Next.js 14 App Router, todas las páginas `dynamic = "force-dynamic"` (datos en vivo, no estáticos)
- Supabase: posts del comisionado, suscripciones push, caché de Power Rankings v2
- Vercel: hosting + variables de entorno
- GitHub Actions: rebuild programado + 2 crons de notificaciones/refresh
- Sleeper API pública (sin key) + endpoints no-oficiales de proyecciones/stats
- ESPN: RSS de noticias + endpoint no-oficial de scoreboard en vivo + endpoint no-oficial de rankings (Power Rankings v2)
- lucide-react (íconos), react-markdown (posts con formato), lottie-web (splash screen), web-push (notificaciones)

## Páginas del sitio

Home, Scores (ya no "en vivo" — se actualiza al cargar, sin polling), My Team
(tabs: Rankings/Roster/Trades), Power Rankings, Weekly Report, Trades, Waiver
Wins, Bust/Boom, Head-to-Head, Teams, Top 300, **Player Stats** (comparador
de jugadores con búsqueda + fotos), News. Más: `/setup` (onboarding),
`/admin` (editor protegido con contraseña).

**Menú lateral agrupado** (`app/components/Sidebar.js`): Home y My Team
siempre visibles arriba; el resto vive en 3 grupos desplegables — **Feed**
(News, Scores, Weekly Report), **Rankings** (Power Rankings, Top 300, Player
Stats, Head-to-Head), **Playbook** (Trades, Waiver Wins, Bust/Boom, Teams).
El grupo que contiene la página activa se abre solo.

## Funciones clave (todas en `/lib`)

- `sleeper.js` — funciones base de la API de Sleeper, incluye `getRegularSeasonState()` que ancla todo a "semana 1" hasta que `season_type` sea "regular" (evita saltos raros en pretemporada)
- `session.js` — lee la liga/equipo del visitante desde cookies (`getLeagueId()`, `getMyRosterId()`)
- `posts.js` + `CommishPost.js` — sistema "A word from the Commish:" en las 9 páginas, editable desde `/admin` con formato Markdown básico (negritas/títulos/listas)
- `push.js` + service worker (`public/sw.js`) — notificaciones cuando se publica un post, o el resumen semanal de los martes
- `weeklyReportStats.js` — Best/Worst Coach + Prime/Shit Players/Wire Targets
- `powerRankingsV2.js` + `powerRankingsV2Cache.js` — power ranking alterno basado en calidad de roster (ESPN), cacheado en Supabase, se recalcula 2x/día vía cron — **solo para la liga del dueño (`SLEEPER_LEAGUE_ID`), no por visitante**
- `teamLogo.js` — logos de Defensa (DEF) en vez de foto de jugador rota
- `playersCache.js` — diccionario completo de jugadores de Sleeper (~5MB) cacheado en Supabase, refrescado 1x/día vía cron (Sleeper pide no pedirlo más seguido)
- `playerStats.js` + `positionStatFields.js` — desglose completo de stats por jugador (yardas, TDs, etc.), usado en `/players` con ranking calculado contra todos los peers de esa posición
- `espnScores.js` — marcadores de ESPN, ahora usado directo por `/scores` (ya no hay `/api/scores`, se quitó el polling de 30s)

## Widget de iOS (Scriptable) — proyecto hermano, vive fuera de Next.js

`public/scriptable/sleeper-widget.js` — widget para pantalla de inicio del
iPhone, hecho en JavaScript para la app Scriptable (no corre en el
navegador). Colores alineados a los tokens de la web app. Se comparte a los
usuarios desde un banner en Home (`WidgetBanner.js`) con instrucciones +
botón de copiar que hace fetch a ese archivo estático.

**Estado actual del widget:** muestra avatar+nombre del equipo, récord en la
esquina, barra de % de ganar (calculada con proyecciones reales de Sleeper,
no con amortiguación por hora), y una fila de 4 jugadores (QB1/RB1/WR1/TE1)
con un anillo de color alrededor de la foto (rojo = por debajo de lo
proyectado, verde = lo alcanzó, azul = lo superó — color sólido, no un arco
que se va llenando).

**Pendiente/nota importante:** el usuario pidió que el anillo fuera una
"barra de carga" real (un arco de progreso que se llena %, no solo un
color sólido). Eso requiere `DrawContext` + `Path.addArc()` de Scriptable,
que **no se pudo probar en vivo** (sin entorno iOS para ejecutar Scriptable
real) — se implementó la versión segura (anillo de color sólido) en su
lugar. Si se retoma esto, hay que construir la versión con arco de
progreso real y que el usuario la pruebe en su iPhone y reporte si la
sintaxis de `Path.addArc()` funcionó.

**Importante:** cualquier usuario que ya tenía el widget configurado ANTES
de la versión con el anillo de 4 jugadores necesita volver a correr el
script dentro de la app Scriptable (no como widget) — la versión vieja no
guardaba la posición (QB/RB/WR/TE) de cada jugador del roster, solo el
nombre.

## Cosas configuradas fuera del código (revisar si algo no funciona)

**Vercel — Environment Variables:**
`SLEEPER_LEAGUE_ID` (respaldo/liga del dueño), `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `CRON_SECRET`

**GitHub — Secrets:** `SITE_URL`, `CRON_SECRET` (debe ser IDÉNTICO al de Vercel)

**Supabase — tablas (correr los 4 SQL en orden):**
`supabase-setup.sql` (posts), `supabase-push-setup.sql` (suscripciones),
`supabase-power-rankings-v2-setup.sql` (caché de rankings v2),
`supabase-players-cache-setup.sql` (caché del diccionario de jugadores)

**GitHub Actions workflows:**
`rebuild.yml` (actualiza el sitio, cada 4h / cada 15min en días de partido),
`weekly-summary-push.yml` (martes 9am), `power-rankings-v2-refresh.yml` (2x/día),
`players-cache-refresh.yml` (1x/día, 5am)

## Limitaciones conocidas / cosas no-oficiales a vigilar

- Endpoints no-documentados de Sleeper (proyecciones, stats, players): estables pero podrían cambiar
- Endpoint de scoreboard de ESPN (`/scores`): no oficial
- Endpoint de rankings de ESPN (Power Rankings v2): no oficial, con respaldo automático a ADP si falla — revisar logs de Vercel (`[powerRankingsV2]`) tras el primer refresh
- Admin/push/Power Rankings v2 son "de un solo dueño" (ligados a `SLEEPER_LEAGUE_ID`), no funcionan distinto por cada visitante multi-liga

## Cómo seguir trabajando

1. Pega este archivo al inicio de un chat nuevo con Claude
2. Descríbele el cambio que quieres
3. Va a generar el código actualizado y un .zip para descargar
4. Subes ese .zip (o los archivos sueltos) a tu repo de GitHub → Vercel redeploya solo
