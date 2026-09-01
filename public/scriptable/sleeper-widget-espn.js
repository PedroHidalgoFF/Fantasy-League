// Fantasy Football — Widget de puntuación en vivo (1 a 3 equipos, Sleeper y/o ESPN)
//
// ⚠️ CAMBIO IMPORTANTE: esta versión agrega soporte para ligas de ESPN
// (además de Sleeper) y sigue soportando 1-3 equipos en un solo widget,
// mezclando plataformas si quieres. Si ya tenías este widget configurado
// con una versión anterior, necesitas volver a correr el script UNA VEZ
// dentro de la app Scriptable (no como widget) para configurarlo de nuevo.
//
// ESPN: solo soporta LIGAS PÚBLICAS por ahora (no requiere login/cookies).
// Para ligas privadas de ESPN se necesitarían las cookies SWID y espn_s2
// de una sesión iniciada — no está implementado en esta versión.
//
// Uso: 1) Corre este script UNA VEZ dentro de la app Scriptable (no como
//         widget): elige cuántos equipos (1-3) y, por cada uno, si es de
//         Sleeper o de ESPN.
//      2) Agrega el widget a tu pantalla de inicio y selecciona este
//         script. Tamaño sugerido: "Mediano" para 1 equipo, "Grande"
//         para 2 o 3.
//
// Colores: alineados a los design tokens de la web app (fantasy-partner).

const CONFIG_KEY = "sleeperWidgetConfigV2"
const SEASON = "2026" // temporada NFL actual

// ---------- Paleta (tokens de la web app) ----------
const COLOR_BG = "#0d0d0d"
const COLOR_ACCENT = "#6fbf1f"
const COLOR_MUTED = "#9ca3af"
const COLOR_TRACK = "#2a2c2a"
const COLOR_FAINT = "#4a4f47"
const COLOR_WHITE = "#f1f1f1"
const COLOR_TIER_RED = "#ef4444"
const COLOR_TIER_ORANGE = "#f97316"
const COLOR_TIER_YELLOW = "#facc15"
const COLOR_TIER_GREEN = "#22c55e"
const COLOR_TIER_BLUE = "#3b82f6"

const FEATURED_POSITIONS = ["QB", "RB", "WR", "TE"]
const PROGRESS_MARKER_PCT = 0.75
const PROGRESS_MARKER_LINE_WIDTH = 1.5

const FAMILY_BAR_WIDTH = { small: 115, medium: 290, large: 290 }

// Logos de plataforma (Sleeper / ESPN) — se descargan del propio sitio
// (mismo cache local que las fotos de jugadores) para no depender de
// adivinar URLs de los CDNs de Sleeper/ESPN.
const SITE_BASE_URL = "https://fantasy-league-bice.vercel.app"
const PLATFORM_LOGO_URL = {
  sleeper: `${SITE_BASE_URL}/logos/sleeper.png`,
  espn: `${SITE_BASE_URL}/logos/espn.png`,
}

// ESPN: qué lineupSlotId corresponde a qué posición mostrada, y cuáles
// slots cuentan como "titular" (todo menos banca/IR) para el total.
const ESPN_SLOT_POSITIONS = { 0: "QB", 2: "RB", 4: "WR", 6: "TE" }
const ESPN_BENCH_SLOTS = [20, 21]

const PROFILES = {
  1: {
    ringSize: 54, ringBg: 48, photoSize: 48, avatarSize: 26, playerColWidth: 54, badgeSize: 16,
    barHeight: 7, font: { name: 15, record: 14, label: 9, pos: 9, pts: 8, updated: 9 },
    spacer: { afterHeader: 8, afterFloating: 1, noFloating: 2, afterBar: 8, beforePlayers: 3, afterPlayers: 8 },
  },
  2: {
    ringSize: 44, ringBg: 39, photoSize: 39, avatarSize: 22, playerColWidth: 46, badgeSize: 14,
    barHeight: 6, font: { name: 13, record: 12, label: 8, pos: 8, pts: 7, updated: 9 },
    spacer: { afterHeader: 5, afterFloating: 1, noFloating: 2, afterBar: 6, beforePlayers: 2, afterPlayers: 0 },
  },
  3: {
    ringSize: 38, ringBg: 34, photoSize: 34, avatarSize: 18, playerColWidth: 40, badgeSize: 12,
    barHeight: 5, font: { name: 12, record: 11, label: 7, pos: 7, pts: 6.5, updated: 8 },
    spacer: { afterHeader: 3, afterFloating: 1, noFloating: 1, afterBar: 5, beforePlayers: 2, afterPlayers: 0 },
  },
}

// ---------- Utilidades de almacenamiento ----------
function loadConfig() {
  try {
    const raw = Keychain.get(CONFIG_KEY)
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function saveConfig(cfg) {
  Keychain.set(CONFIG_KEY, JSON.stringify(cfg))
}

// ---------- HTTP genérico ----------
async function getJSON(url, headers) {
  const req = new Request(url)
  if (headers) req.headers = headers
  return await req.loadJSON()
}

// ---------- Sleeper ----------
async function getSleeperUser(username) {
  return await getJSON(`https://api.sleeper.app/v1/user/${username}`)
}

async function getSleeperLeagues(userId) {
  return await getJSON(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${SEASON}`)
}

async function getSleeperRosters(leagueId) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
}

async function getSleeperLeagueUsers(leagueId) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/users`)
}

async function getSleeperMatchups(leagueId, week) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`)
}

async function getNflState() {
  return await getJSON(`https://api.sleeper.app/v1/state/nfl`)
}

async function getSleeperProjections(season, week) {
  const positions = ["QB", "RB", "WR", "TE", "K", "DEF"]
  const posQuery = positions.map(p => `position[]=${p}`).join("&")
  const url = `https://api.sleeper.app/projections/nfl/${season}/${week}?season_type=regular&${posQuery}`
  const list = await getJSON(url)
  const byId = {}
  for (const entry of list) {
    const pts = entry.stats && entry.stats.pts_ppr
    if (entry.player_id && typeof pts === "number") byId[entry.player_id] = pts
  }
  return byId
}

async function buildSleeperPlayerInfoForIds(ids) {
  const allPlayers = await getJSON("https://api.sleeper.app/v1/players/nfl")
  const info = {}
  for (const id of ids) {
    const p = allPlayers[id]
    if (!p) { info[id] = { name: id, position: null }; continue }
    const name = p.position === "DEF" ? `${p.team} DEF` : `${p.first_name} ${p.last_name}`.trim()
    info[id] = { name, position: p.position || null }
  }
  return info
}

// ---------- ESPN (solo ligas públicas — sin cookies) ----------
async function getEspnLeague(leagueId, season, views, scoringPeriodId) {
  const viewQuery = views.map(v => `view=${v}`).join("&")
  const spQuery = scoringPeriodId ? `&scoringPeriodId=${scoringPeriodId}` : ""
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?${viewQuery}${spQuery}`
  return await getJSON(url)
}

async function getEspnTeamsList(leagueId, season) {
  const data = await getEspnLeague(leagueId, season, ["mTeam"])
  return (data.teams || []).map(t => ({
    id: t.id,
    name: t.name || `${t.location || ""} ${t.nickname || ""}`.trim() || `Team ${t.id}`,
    logo: t.logo || null
  }))
}

function espnPlayerProjectedActual(playerStats, week) {
  let projected = 0
  let actual = 0
  for (const s of (playerStats || [])) {
    if (s.scoringPeriodId !== week) continue
    if (s.statSourceId === 1) projected = s.appliedTotal || 0
    if (s.statSourceId === 0) actual = s.appliedTotal || 0
  }
  return { projected, actual }
}

// ---------- Imagen con cache local ----------
async function getImage(url) {
  const fm = FileManager.local()
  const fileName = "sleeper_img_" + Data.fromString(url).toBase64String().replace(/[\/+=]/g, "") + ".img"
  const path = fm.joinPath(fm.documentsDirectory(), fileName)

  if (fm.fileExists(path)) {
    try {
      const cached = fm.readImage(path)
      if (cached && cached.size && cached.size.width > 0) return cached
    } catch (e) { /* caché corrupto — lo tiramos y lo volvemos a descargar abajo */ }
    try { fm.remove(path) } catch (e) { /* no pasa nada si no se pudo borrar */ }
  }
  const req = new Request(url)
  const data = await req.load()
  const img = Image.fromData(data)
  try { fm.writeImage(path, img) } catch (e) { /* si falla el cache, no pasa nada */ }
  return img
}

function formatUpdated(date) {
  const now = new Date()
  const isToday = date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "pm" : "am"
  hours = hours % 12
  if (hours === 0) hours = 12
  const timeStr = `${hours}:${minutes} ${ampm}`

  if (isToday) return `Hoy ${timeStr}`
  const dd = date.getDate().toString().padStart(2, "0")
  const mm = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${dd}/${mm} ${timeStr}`
}

// ---------- Configuración: 1-3 equipos, Sleeper y/o ESPN ----------
async function pickTeamCount() {
  const a = new Alert()
  a.title = "¿Cuántos equipos?"
  a.message = "Puedes mezclar equipos de Sleeper y de ESPN en el mismo widget."
  a.addAction("1 equipo")
  a.addAction("2 equipos")
  a.addAction("3 equipos")
  a.addCancelAction("Cancelar")
  const idx = await a.presentSheet()
  if (idx < 0 || idx > 2) return null
  return idx + 1
}

async function pickPlatform(slotLabel) {
  const a = new Alert()
  a.title = `¿De qué plataforma es tu ${slotLabel}?`
  a.addAction("Sleeper")
  a.addAction("ESPN (liga pública)")
  a.addCancelAction("Cancelar")
  const idx = await a.presentSheet()
  if (idx === 0) return "sleeper"
  if (idx === 1) return "espn"
  return null
}

async function pickSleeperLeague(leagues, alreadyPickedIds, title) {
  const table = new Alert()
  table.title = title
  const options = leagues.filter(l => !alreadyPickedIds.includes(l.league_id))
  options.forEach(l => table.addAction(l.name))
  table.addCancelAction("Cancelar")
  const idx = await table.presentSheet()
  if (idx < 0 || idx >= options.length) return null
  return options[idx]
}

async function setupSleeperTeamForLeague(league, user) {
  const rosters = await getSleeperRosters(league.league_id)
  const myRoster = rosters.find(r => r.owner_id === user.user_id)
  if (!myRoster) return null

  const leagueUsers = await getSleeperLeagueUsers(league.league_id)
  const myUserInfo = leagueUsers.find(u => u.user_id === user.user_id)
  const teamName = (myUserInfo && myUserInfo.metadata && myUserInfo.metadata.team_name)
    ? myUserInfo.metadata.team_name
    : (myUserInfo ? myUserInfo.display_name : user.username)

  let avatarUrl = null
  if (myUserInfo && myUserInfo.metadata && myUserInfo.metadata.avatar) {
    avatarUrl = myUserInfo.metadata.avatar
  } else if (myUserInfo && myUserInfo.avatar) {
    avatarUrl = `https://sleepercdn.com/avatars/thumbs/${myUserInfo.avatar}`
  }

  const playerInfoMap = await buildSleeperPlayerInfoForIds(myRoster.players || [])

  return {
    platform: "sleeper",
    leagueId: league.league_id,
    leagueName: league.name,
    rosterId: myRoster.roster_id,
    teamName,
    avatarUrl,
    playerInfoMap
  }
}

async function setupEspnTeam() {
  const idAlert = new Alert()
  idAlert.title = "ESPN — ID de tu liga"
  idAlert.message = "Lo encuentras en la URL al abrir tu liga en fantasy.espn.com (…leagueId=XXXXXXX). Debe ser una liga PÚBLICA."
  idAlert.addTextField("ej. 123456789")
  idAlert.addAction("Continuar")
  idAlert.addCancelAction("Cancelar")
  const btn = await idAlert.present()
  if (btn === -1) return null
  const leagueId = idAlert.textFieldValue(0).trim()
  if (!leagueId) return null

  let teams
  try {
    teams = await getEspnTeamsList(leagueId, SEASON)
  } catch (e) {
    const err = new Alert()
    err.title = "No se pudo leer esa liga"
    err.message = "Confirma que el ID es correcto y que la liga es pública (sin login)."
    await err.present()
    return null
  }
  if (!teams || teams.length === 0) {
    const err = new Alert()
    err.title = "Sin equipos"
    err.message = "No se encontraron equipos en esa liga."
    await err.present()
    return null
  }

  const table = new Alert()
  table.title = "Elige tu equipo"
  teams.forEach(t => table.addAction(t.name))
  table.addCancelAction("Cancelar")
  const idx = await table.presentSheet()
  if (idx < 0 || idx >= teams.length) return null
  const chosen = teams[idx]

  return {
    platform: "espn",
    leagueId,
    leagueName: `ESPN #${leagueId}`,
    season: SEASON,
    teamId: chosen.id,
    teamName: chosen.name,
    avatarUrl: chosen.logo
  }
}

async function runSetup() {
  const count = await pickTeamCount()
  if (!count) return

  const teams = []
  let sleeperUser = null
  let sleeperLeagues = null
  const pickedSleeperLeagueIds = []
  const slotLabels = ["primer equipo", "segundo equipo", "tercer equipo"]

  for (let i = 0; i < count; i++) {
    const platform = await pickPlatform(slotLabels[i])
    if (!platform) return

    if (platform === "sleeper") {
      if (!sleeperUser) {
        const usernameAlert = new Alert()
        usernameAlert.title = "Sleeper — Tu usuario"
        usernameAlert.message = "Escribe tu username de Sleeper"
        usernameAlert.addTextField("username")
        usernameAlert.addAction("Continuar")
        await usernameAlert.present()
        const username = usernameAlert.textFieldValue(0).trim()

        const user = await getSleeperUser(username)
        if (!user || !user.user_id) {
          const err = new Alert()
          err.title = "No encontrado"
          err.message = "No se encontró ese username en Sleeper."
          await err.present()
          return
        }
        user.username = username
        sleeperUser = user

        sleeperLeagues = await getSleeperLeagues(user.user_id)
        if (!sleeperLeagues || sleeperLeagues.length === 0) {
          const err = new Alert()
          err.title = "Sin ligas"
          err.message = `No se encontraron ligas de Sleeper para la temporada ${SEASON}.`
          await err.present()
          return
        }
      }

      const league = await pickSleeperLeague(sleeperLeagues, pickedSleeperLeagueIds, `Elige la liga de Sleeper (${slotLabels[i]})`)
      if (!league) return
      pickedSleeperLeagueIds.push(league.league_id)

      const team = await setupSleeperTeamForLeague(league, sleeperUser)
      if (!team) {
        const err = new Alert()
        err.title = "Error"
        err.message = `No se encontró tu equipo en "${league.name}".`
        await err.present()
        return
      }
      teams.push(team)
    } else {
      const team = await setupEspnTeam()
      if (!team) return
      teams.push(team)
    }
  }

  saveConfig({ teams })

  const done = new Alert()
  done.title = "Listo ✅"
  const sizeHint = teams.length === 1 ? "Mediano" : "Grande"
  done.message = `Configurado: ${teams.map(t => t.teamName).join(" / ")}. Agrega el widget en tamaño ${sizeHint}.`
  await done.present()
}

// ---------- Helpers visuales ----------
function addRingedPhoto(parentStack, photoImg, ringColor, ringSize, bgCircleSize, photoSize) {
  const ringStack = parentStack.addStack()
  ringStack.size = new Size(ringSize, ringSize)
  ringStack.backgroundColor = new Color(ringColor)
  ringStack.cornerRadius = ringSize / 2
  ringStack.layoutHorizontally()
  ringStack.centerAlignContent()
  ringStack.addSpacer()

  const bgCol = ringStack.addStack()
  bgCol.layoutVertically()
  bgCol.addSpacer()

  const bgRow = bgCol.addStack()
  bgRow.size = new Size(bgCircleSize, bgCircleSize)
  bgRow.backgroundColor = new Color(COLOR_BG)
  bgRow.cornerRadius = bgCircleSize / 2
  bgRow.layoutHorizontally()
  bgRow.centerAlignContent()
  bgRow.addSpacer()

  const photoCol = bgRow.addStack()
  photoCol.layoutVertically()
  photoCol.addSpacer()

  if (photoImg) {
    const inner = photoCol.addImage(photoImg)
    inner.imageSize = new Size(photoSize, photoSize)
    inner.cornerRadius = photoSize / 2
    inner.applyFillingContentMode()
  }

  photoCol.addSpacer()
  bgRow.addSpacer()

  bgCol.addSpacer()
  ringStack.addSpacer()
}

function ringColorFor(actual, projected) {
  if (!projected || projected <= 0) return COLOR_TRACK
  const pct = (actual / projected) * 100
  if (pct <= 15) return COLOR_TIER_RED
  if (pct <= 50) return COLOR_TIER_ORANGE
  if (pct <= 90) return COLOR_TIER_YELLOW
  if (pct <= 100) return COLOR_TIER_GREEN
  return COLOR_TIER_BLUE
}

function recordColorFor(wins, losses) {
  if (wins === 0 && losses === 0) return COLOR_MUTED
  if (wins > losses) return COLOR_TIER_GREEN
  if (losses > wins) return COLOR_TIER_RED
  return COLOR_MUTED
}

function buildProgressSegments(barWidth, fillPx, fillColor) {
  const markerPx = barWidth * PROGRESS_MARKER_PCT
  const half = PROGRESS_MARKER_LINE_WIDTH / 2
  const fillClamped = Math.max(0, Math.min(fillPx, barWidth))

  const breakpoints = [0, fillClamped, Math.max(0, markerPx - half), Math.min(barWidth, markerPx + half), barWidth]
    .sort((a, b) => a - b)

  const segments = []
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const start = breakpoints[i]
    const end = breakpoints[i + 1]
    const width = end - start
    if (width <= 0.5) continue

    let color
    if (start >= markerPx - half && start < markerPx + half) {
      color = COLOR_WHITE
    } else if (start < fillClamped) {
      color = fillColor
    } else {
      color = COLOR_TRACK
    }
    segments.push({ width, color })
  }
  return segments
}

function addCenteredLabel(parentStack, text, width) {
  const row = parentStack.addStack()
  row.size = new Size(width, 0)
  row.layoutHorizontally()
  row.addSpacer()
  const t = row.addText(text)
  row.addSpacer()
  return t
}

// ---------- Normalización de datos por plataforma ----------
// Ambas plataformas terminan en la MISMA forma, para que el render no le
// importe de dónde vino el dato:
// { teamName, avatarUrl, wins, losses, ties, projectedTotal, actualTotal,
//   players: { QB, RB, WR, TE } } con cada jugador { name, actual, projected, photoUrl }

async function fetchSleeperNormalized(team, week, season) {
  const [matchups, rosters, projections] = await Promise.all([
    getSleeperMatchups(team.leagueId, week),
    getSleeperRosters(team.leagueId),
    getSleeperProjections(season, week).catch(() => ({}))
  ])
  const myRoster = rosters.find(r => r.roster_id === team.rosterId)
  const myMatchup = matchups.find(m => m.roster_id === team.rosterId)
  if (!myMatchup) return null

  const wins = (myRoster && myRoster.settings && myRoster.settings.wins) || 0
  const losses = (myRoster && myRoster.settings && myRoster.settings.losses) || 0
  const ties = (myRoster && myRoster.settings && myRoster.settings.ties) || 0

  const starters = myMatchup.starters || []
  const actualByPlayer = myMatchup.players_points || {}
  const players = { QB: null, RB: null, WR: null, TE: null }
  let projectedTotal = 0
  let actualTotal = 0

  for (const playerId of starters) {
    if (!playerId || playerId === "0") continue
    const projected = projections[playerId] || 0
    const actual = actualByPlayer[playerId] || 0
    projectedTotal += projected
    actualTotal += actual

    const info = team.playerInfoMap && team.playerInfoMap[playerId]
    const pos = info && info.position
    if (pos && FEATURED_POSITIONS.includes(pos) && !players[pos]) {
      players[pos] = { name: info.name, actual, projected, photoUrl: `https://sleepercdn.com/content/nfl/players/${playerId}.jpg` }
    }
  }

  return { teamName: team.teamName, avatarUrl: team.avatarUrl, wins, losses, ties, projectedTotal, actualTotal, players }
}

async function fetchEspnNormalized(team, week) {
  const data = await getEspnLeague(team.leagueId, team.season || SEASON, ["mTeam", "mRoster", "mMatchup", "mMatchupScore"], week)
  const teamData = (data.teams || []).find(t => String(t.id) === String(team.teamId))
  if (!teamData) return null

  const record = teamData.record && teamData.record.overall
  const wins = (record && record.wins) || 0
  const losses = (record && record.losses) || 0
  const ties = (record && record.ties) || 0

  const entries = (teamData.roster && teamData.roster.entries) || []
  const players = { QB: null, RB: null, WR: null, TE: null }
  let projectedTotal = 0
  let actualTotal = 0

  for (const entry of entries) {
    const isBench = ESPN_BENCH_SLOTS.includes(entry.lineupSlotId)
    const playerObj = entry.playerPoolEntry && entry.playerPoolEntry.player
    if (!playerObj) continue

    const { projected, actual } = espnPlayerProjectedActual(playerObj.stats, week)

    if (!isBench) {
      projectedTotal += projected
      actualTotal += actual
    }

    const posLabel = ESPN_SLOT_POSITIONS[entry.lineupSlotId]
    if (posLabel && !players[posLabel]) {
      players[posLabel] = {
        name: playerObj.fullName || "—",
        actual,
        projected,
        photoUrl: `https://a.espncdn.com/i/headshots/nfl/players/full/${playerObj.id}.png`
      }
    }
  }

  return { teamName: team.teamName, avatarUrl: team.avatarUrl, wins, losses, ties, projectedTotal, actualTotal, players }
}

async function fetchNormalizedTeam(team, week, season) {
  if (team.platform === "espn") return await fetchEspnNormalized(team, week)
  return await fetchSleeperNormalized(team, week, season)
}

// ---------- Un bloque de equipo (platform-agnostic) ----------
async function addTeamBlock(widget, data, barWidth, profile, platform) {
  const recordStr = data.ties > 0 ? `${data.wins}-${data.losses}-${data.ties}` : `${data.wins}-${data.losses}`
  const progressColor = ringColorFor(data.actualTotal, data.projectedTotal)

  const topRow = widget.addStack()
  topRow.layoutHorizontally()
  topRow.centerAlignContent()

  if (data.avatarUrl) {
    try {
      const avatarImg = await getImage(data.avatarUrl)
      const avatarElement = topRow.addImage(avatarImg)
      avatarElement.imageSize = new Size(profile.avatarSize, profile.avatarSize)
      avatarElement.cornerRadius = profile.avatarSize / 2
      topRow.addSpacer(6)
    } catch (e) { /* seguimos sin avatar */ }
  }

  const nameText = topRow.addText(data.teamName)
  nameText.font = Font.heavySystemFont(profile.font.name)
  nameText.textColor = new Color(COLOR_WHITE)
  nameText.lineLimit = 1

  const logoUrl = PLATFORM_LOGO_URL[platform]
  if (logoUrl) {
    try {
      const logoImg = await getImage(logoUrl)
      topRow.addSpacer(5)
      const logoElement = topRow.addImage(logoImg)
      logoElement.imageSize = new Size(profile.badgeSize, profile.badgeSize)
      logoElement.cornerRadius = profile.badgeSize / 4
      logoElement.applyFillingContentMode()
    } catch (e) {
      // Diagnóstico temporal: si la descarga del logo falla, en vez de
      // desaparecer en silencio mostramos un "!" rojo — así se puede ver
      // a simple vista si el problema es la descarga o algo más.
      topRow.addSpacer(5)
      const errBadge = topRow.addText("!")
      errBadge.font = Font.boldSystemFont(profile.font.label)
      errBadge.textColor = new Color(COLOR_TIER_RED)
    }
  }

  topRow.addSpacer(8)

  const recordText = topRow.addText(recordStr)
  recordText.font = Font.boldSystemFont(profile.font.record)
  recordText.textColor = new Color(recordColorFor(data.wins, data.losses))

  widget.addSpacer(profile.spacer.afterHeader)

  const labelsRow = widget.addStack()
  labelsRow.layoutHorizontally()
  const zeroLabel = labelsRow.addText("0.0")
  zeroLabel.font = Font.systemFont(profile.font.label)
  zeroLabel.textColor = new Color(COLOR_FAINT)
  labelsRow.addSpacer(Math.round(barWidth * PROGRESS_MARKER_PCT) - 30)
  const projectedLabel = labelsRow.addText(data.projectedTotal.toFixed(2))
  projectedLabel.font = Font.systemFont(profile.font.label)
  projectedLabel.textColor = new Color(COLOR_MUTED)

  const markerPx = barWidth * PROGRESS_MARKER_PCT
  const scale = data.projectedTotal > 0 ? (markerPx / data.projectedTotal) : 0
  const fillPxRaw = data.actualTotal * scale
  const fillPx = Math.max(0, Math.min(fillPxRaw, barWidth))

  if (data.actualTotal > 0.05) {
    const floatingRow = widget.addStack()
    floatingRow.layoutHorizontally()
    floatingRow.addSpacer(Math.max(0, Math.round(fillPx) - 11))
    const actualLabel = floatingRow.addText(data.actualTotal.toFixed(1))
    actualLabel.font = Font.boldSystemFont(profile.font.label)
    actualLabel.textColor = new Color(progressColor)
    widget.addSpacer(profile.spacer.afterFloating)
  } else {
    widget.addSpacer(profile.spacer.noFloating)
  }

  const barRow = widget.addStack()
  barRow.layoutHorizontally()
  const barStack = barRow.addStack()
  barStack.size = new Size(barWidth, profile.barHeight)
  barStack.layoutHorizontally()
  barStack.cornerRadius = 3
  const segments = buildProgressSegments(barWidth, fillPx, progressColor)
  for (const seg of segments) {
    const segStack = barStack.addStack()
    segStack.size = new Size(seg.width, profile.barHeight)
    segStack.backgroundColor = new Color(seg.color)
  }

  widget.addSpacer(profile.spacer.afterBar)

  const playersRow = widget.addStack()
  playersRow.layoutHorizontally()

  for (let i = 0; i < FEATURED_POSITIONS.length; i++) {
    const position = FEATURED_POSITIONS[i]
    const p = data.players[position]

    const col = playersRow.addStack()
    col.layoutVertically()
    col.centerAlignContent()

    if (!p) {
      const placeholder = col.addStack()
      placeholder.size = new Size(profile.ringSize, profile.ringSize)
      placeholder.backgroundColor = new Color(COLOR_TRACK)
      placeholder.cornerRadius = profile.ringSize / 2
      const posLabel = addCenteredLabel(col, position, profile.playerColWidth)
      posLabel.font = Font.systemFont(profile.font.pos - 1)
      posLabel.textColor = new Color(COLOR_FAINT)
    } else {
      const ringColor = ringColorFor(p.actual, p.projected)

      let photoImg = null
      try {
        photoImg = await getImage(p.photoUrl)
      } catch (e) { /* anillo vacío si falla */ }

      addRingedPhoto(col, photoImg, ringColor, profile.ringSize, profile.ringBg, profile.photoSize)

      col.addSpacer(profile.spacer.beforePlayers)
      const posLabel = addCenteredLabel(col, position, profile.playerColWidth)
      posLabel.font = Font.boldSystemFont(profile.font.pos)
      posLabel.textColor = new Color(COLOR_MUTED)

      const ptsLabel = addCenteredLabel(col, `${p.actual.toFixed(1)}/${p.projected.toFixed(1)}`, profile.playerColWidth)
      ptsLabel.font = Font.systemFont(profile.font.pts)
      ptsLabel.textColor = new Color(COLOR_FAINT)
    }

    if (i < FEATURED_POSITIONS.length - 1) playersRow.addSpacer()
  }

  if (profile.spacer.afterPlayers > 0) widget.addSpacer(profile.spacer.afterPlayers)
}

async function buildWidget(config) {
  const widget = new ListWidget()
  widget.backgroundColor = new Color(COLOR_BG)
  widget.url = "scriptable:///run/" + encodeURIComponent(Script.name())

  if (!config.teams || config.teams.length === 0) {
    const t = widget.addText("Vuelve a correr el script dentro de la app Scriptable para configurarlo.")
    t.font = Font.systemFont(12)
    t.textColor = new Color(COLOR_WHITE)
    return widget
  }

  const teamCount = config.teams.length
  const profile = PROFILES[teamCount] || PROFILES[3]
  const barWidth = FAMILY_BAR_WIDTH[config.widgetFamily] || FAMILY_BAR_WIDTH.medium

  try {
    // La semana de la NFL se toma siempre de Sleeper (endpoint público, no
    // requiere cuenta) y se reusa para los equipos de ESPN también — es el
    // mismo calendario de temporada regular en ambas plataformas.
    const state = await getNflState()
    const week = Math.max(1, state.week || 1)
    const season = state.season || SEASON

    const results = await Promise.all(
      config.teams.map(team => fetchNormalizedTeam(team, week, season).catch(() => null))
    )

    for (const [i, data] of results.entries()) {
      const team = config.teams[i]
      if (!data) {
        const t = widget.addText(`${team.teamName}: sin datos esta semana`)
        t.font = Font.systemFont(10)
        t.textColor = new Color(COLOR_FAINT)
      } else {
        await addTeamBlock(widget, data, barWidth, profile, team.platform || "sleeper")
      }

      if (i < results.length - 1) {
        const dividerSpacer = teamCount === 3 ? 6 : 8
        widget.addSpacer(dividerSpacer)
        const divider = widget.addStack()
        divider.size = new Size(0, 1)
        divider.backgroundColor = new Color(COLOR_TRACK)
        widget.addSpacer(dividerSpacer)
      }
    }

    widget.addSpacer(teamCount > 1 ? 6 : 8)
    const updatedRow = widget.addStack()
    updatedRow.layoutHorizontally()
    updatedRow.addSpacer()
    const updatedText = updatedRow.addText(formatUpdated(new Date()))
    updatedText.font = Font.systemFont(profile.font.updated)
    updatedText.textColor = new Color(COLOR_FAINT)

  } catch (e) {
    const errText = widget.addText("Error: " + e.message)
    errText.font = Font.systemFont(11)
    errText.textColor = Color.white()
  }

  return widget
}

// Diagnóstico: intenta bajar cada logo y muestra el mensaje de error EXACTO
// si falla, en vez de solo el "!" genérico del widget.
async function debugLogoDownloads() {
  const lines = []
  for (const [platform, url] of Object.entries(PLATFORM_LOGO_URL)) {
    try {
      const req = new Request(url)
      const data = await req.load()
      lines.push(`${platform.toUpperCase()}: OK — ${data.length} bytes descargados`)
      try {
        const img = Image.fromData(data)
        lines.push(`  Image.fromData: OK — ${img.size.width}x${img.size.height}`)
      } catch (e2) {
        lines.push(`  Image.fromData FALLÓ: ${e2.message}`)
      }
    } catch (e) {
      lines.push(`${platform.toUpperCase()}: FALLÓ — ${e.message}`)
    }
    lines.push(`  URL: ${url}`)
    lines.push("")
  }
  await QuickLook.present(lines.join("\n"))
}

async function main() {
  if (config.runsInWidget) {
    try {
      const savedConfig = loadConfig()
      if (!savedConfig || !savedConfig.teams) {
        const w = new ListWidget()
        w.backgroundColor = new Color(COLOR_BG)
        const t = w.addText("Abre la app Scriptable y corre este script para configurarlo.")
        t.font = Font.systemFont(12)
        t.textColor = new Color(COLOR_WHITE)
        Script.setWidget(w)
      } else {
        const widget = await buildWidget(savedConfig)
        Script.setWidget(widget)
      }
    } catch (e) {
      const w = new ListWidget()
      w.backgroundColor = new Color(COLOR_BG)
      const t = w.addText("Error: " + e.message)
      t.font = Font.systemFont(11)
      t.textColor = Color.red()
      Script.setWidget(w)
    }
    Script.complete()
  } else {
    const savedConfig = loadConfig()
    if (savedConfig && savedConfig.teams) {
      const choice = new Alert()
      choice.title = "Ya está configurado"
      choice.message = `Equipos actuales: ${savedConfig.teams.map(t => `${t.teamName} (${t.platform || "sleeper"})`).join(" / ")}`
      choice.addAction("Reconfigurar (elegir otra cantidad / otros equipos)")
      choice.addAction("Diagnóstico: probar descarga de logos")
      choice.addCancelAction("Cancelar")
      const idx = await choice.presentSheet()
      if (idx === 0) await runSetup()
      if (idx === 1) await debugLogoDownloads()
    } else {
      await runSetup()
    }
  }
}

await main()
