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

Home, Live Scores (en vivo, 30s), My Team (tabs: Rankings/Roster/Trades),
Power Rankings, Weekly Report, Trades, Waiver Wins, Bust/Boom, Head-to-Head,
Teams, Top 300, News. Más: `/setup` (onboarding), `/admin` (editor protegido
con contraseña).

## Funciones clave (todas en `/lib`)

- `sleeper.js` — funciones base de la API de Sleeper, incluye `getRegularSeasonState()` que ancla todo a "semana 1" hasta que `season_type` sea "regular" (evita saltos raros en pretemporada)
- `session.js` — lee la liga/equipo del visitante desde cookies (`getLeagueId()`, `getMyRosterId()`)
- `posts.js` + `CommishPost.js` — sistema "A word from the Commish:" en las 9 páginas, editable desde `/admin` con formato Markdown básico (negritas/títulos/listas)
- `push.js` + service worker (`public/sw.js`) — notificaciones cuando se publica un post, o el resumen semanal de los martes
- `weeklyReportStats.js` — Best/Worst Coach + Prime/Shit Players/Wire Targets
- `powerRankingsV2.js` + `powerRankingsV2Cache.js` — power ranking alterno basado en calidad de roster (ESPN), cacheado en Supabase, se recalcula 2x/día vía cron — **solo para la liga del dueño (`SLEEPER_LEAGUE_ID`), no por visitante**
- `teamLogo.js` — logos de Defensa (DEF) en vez de foto de jugador rota

## Cosas configuradas fuera del código (revisar si algo no funciona)

**Vercel — Environment Variables:**
`SLEEPER_LEAGUE_ID` (respaldo/liga del dueño), `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `CRON_SECRET`

**GitHub — Secrets:** `SITE_URL`, `CRON_SECRET` (debe ser IDÉNTICO al de Vercel)

**Supabase — tablas (correr los 3 SQL en orden):**
`supabase-setup.sql` (posts), `supabase-push-setup.sql` (suscripciones),
`supabase-power-rankings-v2-setup.sql` (caché de rankings v2)

**GitHub Actions workflows:**
`rebuild.yml` (actualiza el sitio, cada 4h / cada 15min en días de partido),
`weekly-summary-push.yml` (martes 9am), `power-rankings-v2-refresh.yml` (2x/día)

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
