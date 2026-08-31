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

**Estado actual del widget (ya resuelto, no es pendiente):**
- Avatar + nombre del equipo, récord en la esquina superior derecha
- Fila de **puntos esperados** (mío vs rival, en números reales — ej.
  "94.2 [barra] 88.5", ya NO es un % de "WIN") + barra proporcional
- Fila de 4 jugadores (QB1/RB1/WR1/TE1) con foto circular y un **anillo de
  color de 5 tonos** alrededor (rojo 0-15%, naranja 16-50%, amarillo
  51-90%, verde 91-100%, azul más de 100% de los puntos proyectados ya
  alcanzados) — el anillo es sólido, no un arco que se llena progresivamente
- El anillo usa una técnica de 3 capas (círculo de color → círculo del
  color de fondo del widget, un poco más chico → foto encima) con
  `centerAlignContent()` en los stacks horizontales para que quede
  perfectamente centrado — esto costó varias iteraciones, si se vuelve a
  tocar la función `addRingedPhoto()`, cuidado con romper el centrado

**Ya NO es pendiente:** la idea original de un arco de progreso real
(`DrawContext` + `Path.addArc()`) se descartó a favor del anillo de color
sólido de 3 capas — funciona bien y ya está probado en el iPhone del
usuario.

**Importante:** cualquier usuario que ya tenía el widget configurado ANTES
de la versión con el anillo de 4 jugadores necesita volver a correr el
script dentro de la app Scriptable (no como widget) — la versión vieja no
guardaba la posición (QB/RB/WR/TE) de cada jugador del roster, solo el
nombre.

**Pendiente real:** el script actualizado (con la barra de puntos
esperados) ya se probó y confirmó que funciona bien en Scriptable, pero
**todavía no se integró** a `public/scriptable/sleeper-widget.js` en el
repo — hay que copiar el script final (el usuario lo tiene, probado) al
archivo del sitio para que el botón "Copy widget code" del banner quede
actualizado para todos los demás usuarios.

## Puntos esperados del matchup (para el widget, vía API)

Nueva función pensada específicamente para que el widget de Scriptable (u
otro consumidor externo) pueda pedir "puntos esperados: mi equipo vs
rival" sin tener que recalcular todo desde cero cada vez:

- `lib/sleeper.js` → `getExpectedPointsForMatchup(leagueId, season, week, rosterId)`
  — encuentra el matchup de ese rosterId por `matchup_id`, suma proyecciones
  de los `starters` de cada lado, devuelve
  `{ week, myTeam: {rosterId, pointsExpected}, opponent: {...} | null }`
- `app/api/expected-points/[leagueId]/[week]/route.js` — Route Handler:
  `GET /api/expected-points/<leagueId>/<week>?rosterId=<rosterId>`. Usa
  `unstable_cache` de Next (ISR explícito) con clave
  `["expected-points", leagueId, week, rosterId]` y `revalidate: 300` (5
  min) — cachea por liga+semana+equipo específico, sin depender de
  Supabase/cron (a propósito, porque el sitio es multi-liga y no se sabe
  de antemano qué ligas lo van a visitar)
- **Todavía no está conectado a ninguna página de la web ni al widget** —
  por ahora el widget de Scriptable calcula esto por su cuenta
  (`expectedTeamTotal()` dentro del script), no llama a este endpoint. Es
  una pieza construida pero suelta, lista para conectar cuando se decida
  cómo usarla (¿reemplazar el cálculo del widget por una llamada a este
  endpoint? ¿mostrarlo en alguna página de la web?)

## Otros cambios recientes de UI/UX

- **Navegación con `next/link`** en vez de `<a>` normal, en todo el sitio
  (Sidebar, My Team, Teams, perfil de equipo, Home) — quita la recarga
  completa de página, transiciones más suaves
- **Menú móvil:** My Team está al centro de la barra inferior (Home,
  Scores, My Team, Weekly Report, More). Entrar a My Team manda directo a
  la pestaña **Roster** (ya no Rankings)
- **My Team → Roster:** Starters y Bench son filas horizontales
  deslizables (`overflowX: auto`), no un grid vertical que ocupa toda la
  pantalla
- **Power Rankings v2 cambió de fuente de datos:** el endpoint de ESPN
  resultó no funcionar (devolvía 0 jugadores emparejados) — ahora usa
  `search_rank` de Sleeper (ya cacheado, confiable, sin dependencias
  externas). Función: `computePowerRankingsV2(leagueId)` en
  `lib/powerRankingsV2.js` (ya NO recibe `season` como parámetro)
  - Tanto `/power-rankings` como `/my-team` (tab Rankings) esconden la
    gráfica de puntos-reales-de-temporada cuando está en puros ceros
    (pretemporada) y muestran un aviso apuntando a "Roster Quality
    Rankings" en su lugar
- **`/players` (Player Stats) rediseñado:** modal "Select Players" con
  grid de fotos + búsqueda (funciona incluso sin escribir texto, muestra
  top jugadores de esa posición), tarjetas de comparación más chicas,
  toggle Average/Total, y toggle **"This Season" / "Last Season"** (usa
  `seasonChoice=previous` en `/api/players/stats` para traer temporada
  2025 completa cuando la actual todavía no tiene datos)
- **`.github/workflows/` — cuidado al armar el zip:** en algún punto el
  comando de zip usaba `-x "*.git*"` para excluir la carpeta `.git`, pero
  ese patrón TAMBIÉN excluía `.github` (contiene "git" como substring) —
  por eso los workflows nunca llegaban al repo. Ya se corrigió (zip ya no
  excluye nada), pero si en algún momento un GitHub Actions "no aparece",
  revisar esto primero
- **Viewport meta tag:** le faltaba `width: "device-width", initialScale: 1`
  en `app/layout.js` → causaba que la barra inferior se viera cortada al
  cargar en móvil. Ya está arreglado.
- Inputs con `fontSize` menor a 16px causan zoom automático no deseado en
  Safari iOS al enfocarlos — ya se corrigieron los que había (buscador de
  Top 300, buscador de Player Stats), pero si se agregan inputs nuevos,
  usar siempre `fontSize: "16px"` como mínimo

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
