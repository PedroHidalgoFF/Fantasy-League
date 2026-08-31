// Sleeper Fantasy Football — Widget de puntuación en vivo
// Uso: 1) Corre este script UNA VEZ dentro de la app Scriptable (no como widget)
//         para elegir tu liga y equipo.
//      2) Luego agrega el widget a tu pantalla de inicio y selecciona este script.
//
// ⚠️ Si ya tenías este widget configurado ANTES de esta versión, necesitas
// volver a correr el script UNA VEZ dentro de la app (no como widget) para
// que se guarde la posición (QB/RB/WR/TE) de tus jugadores — la versión
// anterior no guardaba eso.
//
// Datos: usa la API pública de Sleeper (no requiere login ni API key).
// Colores: alineados a los design tokens de la web app (fantasy-partner).
//
// Sugerencia de tamaño: el diseño está pensado para el widget "Mediano".
// Si lo agregas como "Grande", Scriptable puede repartir el espacio
// sobrante entre las filas y verse más separado de lo esperado.

const CONFIG_KEY = "sleeperWidgetConfig"
const SEASON = "2026" // temporada NFL actual

// ---------- Paleta (tokens de la web app) ----------
const COLOR_BG = "#0d0d0d"        // --sidebar-bg
const COLOR_ACCENT = "#6fbf1f"    // --accent
const COLOR_MUTED = "#9ca3af"     // --sidebar-text
const COLOR_TRACK = "#2a2c2a"     // --border-soft (dark mode)
const COLOR_FAINT = "#4a4f47"     // tono extra-tenue, sin token directo en el sitio
const COLOR_WHITE = "#f1f1f1"     // --text (dark mode)
const COLOR_TIER_RED = "#ef4444"     // --danger — 0% a 15% de lo proyectado
const COLOR_TIER_ORANGE = "#f97316"  // 16% a 50%
const COLOR_TIER_YELLOW = "#facc15"  // 51% a 90%
const COLOR_TIER_GREEN = "#22c55e"   // --success — 91% a 100%
const COLOR_TIER_BLUE = "#3b82f6"    // más de 100% — superó lo proyectado

// Posiciones que mostramos en la fila de 4 jugadores, en este orden
const FEATURED_POSITIONS = ["QB", "RB", "WR", "TE"]

// Barra de progreso del total del equipo: la marca de "proyección" queda
// fija en este % del ancho de la barra. El otro tramo (hasta el 100% del
// ancho) representa overflow si el equipo supera lo proyectado.
const PROGRESS_MARKER_PCT = 0.75
const PROGRESS_BAR_HEIGHT = 7
const PROGRESS_MARKER_LINE_WIDTH = 1.5
// Ancho de la barra por tamaño de widget — Scriptable no expone el ancho
// real del contenido en runtime, así que usamos los tamaños estándar de
// iOS (menos el padding por defecto) para que la barra llegue de lado a
// lado sin cortarse.
const FAMILY_BAR_WIDTH = { small: 115, medium: 290, large: 290 }

// Ancho de cada columna de jugador (QB/RB/WR/TE) — igual al diámetro del
// anillo, así el texto de abajo se puede centrar exactamente respecto a la
// foto sin importar cuántos caracteres tenga.
const PLAYER_COL_WIDTH = 54

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

// ---------- Llamadas a la API de Sleeper ----------
async function getJSON(url) {
  const req = new Request(url)
  return await req.loadJSON()
}

async function getUser(username) {
  return await getJSON(`https://api.sleeper.app/v1/user/${username}`)
}

async function getLeagues(userId) {
  return await getJSON(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${SEASON}`)
}

async function getRosters(leagueId) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
}

async function getLeagueUsers(leagueId) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/users`)
}

async function getMatchups(leagueId, week) {
  return await getJSON(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`)
}

async function getState() {
  return await getJSON(`https://api.sleeper.app/v1/state/nfl`)
}

// Proyecciones de TODOS los jugadores para una semana (una sola llamada,
// todas las posiciones juntas) — mismo endpoint que usa la web app.
async function getProjections(season, week) {
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

// Descarga una imagen y la cachea localmente (no hace falta bajarla de
// nuevo en cada refresco del widget).
async function getImage(url) {
  const fm = FileManager.local()
  const fileName = "sleeper_img_" + Data.fromString(url).toBase64String().replace(/[\/+=]/g, "") + ".img"
  const path = fm.joinPath(fm.documentsDirectory(), fileName)

  if (fm.fileExists(path)) {
    return fm.readImage(path)
  }
  const req = new Request(url)
  const img = await req.loadImage()
  try { fm.writeImage(path, img) } catch (e) { /* si falla el cache, no pasa nada */ }
  return img
}

// Info (nombre + posición) SOLO para los jugadores de tu roster (se
// construye una vez durante la configuración, dentro de la app — el widget
// nunca descarga el catálogo completo de jugadores de la NFL).
async function buildPlayerInfoForIds(ids) {
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

function playerName(playerInfoMap, id) {
  return (playerInfoMap && playerInfoMap[id]) ? playerInfoMap[id].name : id
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

async function runSetup() {
  const usernameAlert = new Alert()
  usernameAlert.title = "Sleeper — Tu usuario"
  usernameAlert.message = "Escribe tu username de Sleeper"
  usernameAlert.addTextField("username")
  usernameAlert.addAction("Continuar")
  await usernameAlert.present()
  const username = usernameAlert.textFieldValue(0).trim()

  const user = await getUser(username)
  if (!user || !user.user_id) {
    const err = new Alert()
    err.title = "No encontrado"
    err.message = "No se encontró ese username en Sleeper."
    await err.present()
    return
  }

  const leagues = await getLeagues(user.user_id)
  if (!leagues || leagues.length === 0) {
    const err = new Alert()
    err.title = "Sin ligas"
    err.message = `No se encontraron ligas para la temporada ${SEASON}.`
    await err.present()
    return
  }

  const leagueTable = new Alert()
  leagueTable.title = "Elige tu liga"
  leagues.forEach(l => leagueTable.addAction(l.name))
  leagueTable.addCancelAction("Cancelar")
  const leagueIndex = await leagueTable.presentSheet()
  if (leagueIndex < 0 || leagueIndex >= leagues.length) return
  const league = leagues[leagueIndex]

  const rosters = await getRosters(league.league_id)
  const myRoster = rosters.find(r => r.owner_id === user.user_id)
  if (!myRoster) {
    const err = new Alert()
    err.title = "Error"
    err.message = "No se encontró tu equipo en esa liga."
    await err.present()
    return
  }

  const leagueUsers = await getLeagueUsers(league.league_id)
  const myUserInfo = leagueUsers.find(u => u.user_id === user.user_id)
  const teamName = (myUserInfo && myUserInfo.metadata && myUserInfo.metadata.team_name)
    ? myUserInfo.metadata.team_name
    : (myUserInfo ? myUserInfo.display_name : username)

  let avatarUrl = null
  if (myUserInfo && myUserInfo.metadata && myUserInfo.metadata.avatar) {
    avatarUrl = myUserInfo.metadata.avatar
  } else if (myUserInfo && myUserInfo.avatar) {
    avatarUrl = `https://sleepercdn.com/avatars/thumbs/${myUserInfo.avatar}`
  }

  const playerInfoMap = await buildPlayerInfoForIds(myRoster.players || [])

  const config = {
    username,
    userId: user.user_id,
    leagueId: league.league_id,
    leagueName: league.name,
    rosterId: myRoster.roster_id,
    teamName,
    avatarUrl,
    playerInfoMap
  }
  saveConfig(config)

  const done = new Alert()
  done.title = "Listo ✅"
  done.message = `Configurado: ${teamName} en "${league.name}". Ahora agrega el widget a tu pantalla de inicio.`
  await done.present()
}

// Anillo de color con 3 capas, para que cualquier imperfección de centrado
// se "esconda" en el fondo negro del widget en vez de verse como el color
// del anillo asomándose de forma dispareja:
//   1. Círculo exterior del color de estado (rojo/naranja/amarillo/etc.), SIN foto.
//   2. Círculo del color de FONDO del widget, un poco más chico — hace de
//      "colchón" invisible contra el negro.
//   3. La foto del jugador, centrada encima de ese colchón.
// applyFillingContentMode() fuerza a que la foto RELLENE el círculo
// recortando el exceso. centerAlignContent() en los stacks horizontales
// (ringStack y bgRow) es lo que asegura el centrado vertical correcto.
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

// Escala de 5 colores según el % de puntos esperados (proyección) que ya
// completó el jugador o equipo: 0-15% rojo, 16-50% naranja, 51-90%
// amarillo, 91-100% verde, más de 100% azul. Se usa tanto para los anillos
// de jugadores como para la barra de progreso del total del equipo.
function ringColorFor(actual, projected) {
  if (!projected || projected <= 0) return COLOR_TRACK
  const pct = (actual / projected) * 100
  if (pct <= 15) return COLOR_TIER_RED
  if (pct <= 50) return COLOR_TIER_ORANGE
  if (pct <= 90) return COLOR_TIER_YELLOW
  if (pct <= 100) return COLOR_TIER_GREEN
  return COLOR_TIER_BLUE
}

// Verde si el récord es ganador, rojo si es perdedor, gris si va 0-0 o
// empatado (ej. 3-3).
function recordColorFor(wins, losses) {
  if (wins === 0 && losses === 0) return COLOR_MUTED
  if (wins > losses) return COLOR_TIER_GREEN
  if (losses > wins) return COLOR_TIER_RED
  return COLOR_MUTED
}

// Encuentra, dentro de los titulares, el primer jugador de la posición dada
// (ej. "QB" -> tu QB1 titular).
function findStarterByPosition(starterIds, playerInfoMap, position) {
  return starterIds.find(id => playerInfoMap && playerInfoMap[id] && playerInfoMap[id].position === position) || null
}

// Suma la proyección de cada titular (valor FIJO, no cambia aunque el
// jugador ya haya jugado) — es el total que ancla la marca de la barra.
function sumProjectedTotal(matchup, projections) {
  const starters = matchup.starters || []
  let total = 0
  for (const playerId of starters) {
    if (!playerId || playerId === "0") continue
    total += projections[playerId] || 0
  }
  return total
}

// Suma los puntos REALES anotados hasta ahora (0 si el jugador todavía no
// juega) — es el total que avanza el relleno de la barra en vivo.
function sumActualTotal(matchup) {
  const starters = matchup.starters || []
  const actualByPlayer = matchup.players_points || {}
  let total = 0
  for (const playerId of starters) {
    if (!playerId || playerId === "0") continue
    total += actualByPlayer[playerId] || 0
  }
  return total
}

// Agrega texto centrado dentro de un ancho fijo (spacers flexibles a los
// dos lados) — así el texto queda centrado respecto a un elemento de ese
// mismo ancho (ej. la foto del jugador), sin importar cuántos caracteres
// tenga.
function addCenteredLabel(parentStack, text, width) {
  const row = parentStack.addStack()
  row.size = new Size(width, 0)
  row.layoutHorizontally()
  row.addSpacer()
  const t = row.addText(text)
  row.addSpacer()
  return t
}

// Arma los tramos de color de la barra de progreso: relleno de un solo
// color (según el tier actual) desde 0 hasta el puntaje real, una línea
// blanca fija en el % de la marca de proyección, y track vacío en lo que
// resta. Si el relleno ya pasó la marca, la línea queda "dentro" del
// relleno (se ve como una muesca) en vez de en el borde del track.
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
    if (width <= 0.5) continue // evita segmentos casi invisibles que Scriptable puede rechazar

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

async function buildWidget(config) {
  const widget = new ListWidget()
  widget.backgroundColor = new Color(COLOR_BG)
  widget.url = "scriptable:///run/" + encodeURIComponent(Script.name())

  if (!config.playerInfoMap) {
    const t = widget.addText("Vuelve a correr el script dentro de la app Scriptable para actualizar tu configuración.")
    t.font = Font.systemFont(12)
    t.textColor = new Color(COLOR_WHITE)
    return widget
  }

  try {
    const state = await getState()
    const week = Math.max(1, state.week || 1)

    const [matchups, rosters, projections] = await Promise.all([
      getMatchups(config.leagueId, week),
      getRosters(config.leagueId),
      getProjections(state.season || SEASON, week).catch(() => ({}))
    ])

    const myRoster = rosters.find(r => r.roster_id === config.rosterId)
    const myMatchup = matchups.find(m => m.roster_id === config.rosterId)
    if (!myMatchup) throw new Error("Sin datos de matchup esta semana")

    const wins = (myRoster && myRoster.settings && myRoster.settings.wins) || 0
    const losses = (myRoster && myRoster.settings && myRoster.settings.losses) || 0
    const ties = (myRoster && myRoster.settings && myRoster.settings.ties) || 0
    const recordStr = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`

    // Total proyectado (fijo, ancla la marca de la barra) y total real
    // (avanza en vivo conforme juegan tus titulares).
    const projectedTotal = sumProjectedTotal(myMatchup, projections)
    const actualTotal = sumActualTotal(myMatchup)
    const progressColor = ringColorFor(actualTotal, projectedTotal)

    // ---------- Fila 1: avatar + nombre del equipo + récord (color dinámico) ----------
    const topRow = widget.addStack()
    topRow.layoutHorizontally()
    topRow.centerAlignContent()

    if (config.avatarUrl) {
      try {
        const avatarImg = await getImage(config.avatarUrl)
        const avatarSize = 26
        const avatarElement = topRow.addImage(avatarImg)
        avatarElement.imageSize = new Size(avatarSize, avatarSize)
        avatarElement.cornerRadius = avatarSize / 2
        topRow.addSpacer(8)
      } catch (e) {
        // Si falla la descarga del avatar, seguimos sin él
      }
    }

    const nameText = topRow.addText(config.teamName)
    nameText.font = Font.heavySystemFont(15)
    nameText.textColor = new Color(COLOR_WHITE)
    nameText.lineLimit = 1

    topRow.addSpacer(8)

    const recordText = topRow.addText(recordStr)
    recordText.font = Font.boldSystemFont(14)
    recordText.textColor = new Color(recordColorFor(wins, losses))

    widget.addSpacer(8)

    // ---------- Fila 2: barra de progreso del total del equipo ----------
    const barWidth = FAMILY_BAR_WIDTH[config.widgetFamily] || FAMILY_BAR_WIDTH.medium

    // Línea de etiquetas fijas: "0.0" a la izquierda, la proyección en la
    // marca (75% del ancho).
    const labelsRow = widget.addStack()
    labelsRow.layoutHorizontally()

    const zeroLabel = labelsRow.addText("0.0")
    zeroLabel.font = Font.systemFont(9)
    zeroLabel.textColor = new Color(COLOR_FAINT)

    labelsRow.addSpacer(Math.round(barWidth * PROGRESS_MARKER_PCT) - 34)

    const projectedLabel = labelsRow.addText(projectedTotal.toFixed(2))
    projectedLabel.font = Font.systemFont(9)
    projectedLabel.textColor = new Color(COLOR_MUTED)

    // Posición del borde del relleno, en px dentro de la barra — se usa
    // tanto para la etiqueta flotante como para pintar la barra.
    const markerPx = barWidth * PROGRESS_MARKER_PCT
    const scale = projectedTotal > 0 ? (markerPx / projectedTotal) : 0
    const fillPxRaw = actualTotal * scale
    const fillPx = Math.max(0, Math.min(fillPxRaw, barWidth))

    // Etiqueta flotante del puntaje real, aproximada a la posición del
    // borde del relleno (se mueve conforme suben tus puntos). Se omite
    // mientras el puntaje real sigue en 0 (antes de que arranquen los
    // partidos) para no encimarse con la etiqueta fija "0.0" de la
    // izquierda — en ese caso ambas caerían en el mismo lugar.
    if (actualTotal > 0.05) {
      const floatingRow = widget.addStack()
      floatingRow.layoutHorizontally()
      floatingRow.addSpacer(Math.max(0, Math.round(fillPx) - 12))

      const actualLabel = floatingRow.addText(actualTotal.toFixed(1))
      actualLabel.font = Font.boldSystemFont(9)
      actualLabel.textColor = new Color(progressColor)

      widget.addSpacer(1)
    } else {
      widget.addSpacer(2)
    }

    // La barra: relleno de un solo color (tier actual) + línea blanca fija
    // en la marca de proyección + track vacío en el resto.
    const barRow = widget.addStack()
    barRow.layoutHorizontally()
    const barStack = barRow.addStack()
    barStack.size = new Size(barWidth, PROGRESS_BAR_HEIGHT)
    barStack.layoutHorizontally()
    barStack.cornerRadius = 4

    const segments = buildProgressSegments(barWidth, fillPx, progressColor)
    for (const seg of segments) {
      const segStack = barStack.addStack()
      segStack.size = new Size(seg.width, PROGRESS_BAR_HEIGHT)
      segStack.backgroundColor = new Color(seg.color)
    }

    widget.addSpacer(8)

    // ---------- Fila 3: QB1 / RB1 / WR1 / TE1 con anillo de estado ----------
    const starters = myMatchup.starters || []
    const actualByPlayer = myMatchup.players_points || {}

    const playersRow = widget.addStack()
    playersRow.layoutHorizontally()

    for (let i = 0; i < FEATURED_POSITIONS.length; i++) {
      const position = FEATURED_POSITIONS[i]
      const playerId = findStarterByPosition(starters, config.playerInfoMap, position)

      const col = playersRow.addStack()
      col.layoutVertically()
      col.centerAlignContent()

      if (!playerId) {
        // No hay titular en esa posición esta semana (raro, pero posible)
        const placeholder = col.addStack()
        placeholder.size = new Size(46, 46)
        placeholder.backgroundColor = new Color(COLOR_TRACK)
        placeholder.cornerRadius = 23
        const posLabel = addCenteredLabel(col, position, PLAYER_COL_WIDTH)
        posLabel.font = Font.systemFont(8)
        posLabel.textColor = new Color(COLOR_FAINT)
      } else {
        const actual = actualByPlayer[playerId] || 0
        const projected = projections[playerId] || 0
        const ringColor = ringColorFor(actual, projected)

        let photoImg = null
        try {
          photoImg = await getImage(`https://sleepercdn.com/content/nfl/players/${playerId}.jpg`)
        } catch (e) { /* si falla, se muestra el anillo vacío */ }

        addRingedPhoto(col, photoImg, ringColor, 54, 48, 48)

        col.addSpacer(3)
        const posLabel = addCenteredLabel(col, position, PLAYER_COL_WIDTH)
        posLabel.font = Font.boldSystemFont(9)
        posLabel.textColor = new Color(COLOR_MUTED)

        const ptsLabel = addCenteredLabel(col, `${actual.toFixed(1)}/${projected.toFixed(1)}`, PLAYER_COL_WIDTH)
        ptsLabel.font = Font.systemFont(8)
        ptsLabel.textColor = new Color(COLOR_FAINT)
      }

      if (i < FEATURED_POSITIONS.length - 1) playersRow.addSpacer()
    }

    // ---------- Fila 4: hora de última actualización ----------
    widget.addSpacer(8)
    const updatedRow = widget.addStack()
    updatedRow.layoutHorizontally()
    updatedRow.addSpacer()
    const updatedText = updatedRow.addText(formatUpdated(new Date()))
    updatedText.font = Font.systemFont(9)
    updatedText.textColor = new Color(COLOR_FAINT)

  } catch (e) {
    const errText = widget.addText("Error: " + e.message)
    errText.font = Font.systemFont(11)
    errText.textColor = Color.white()
  }

  return widget
}

async function main() {
  if (config.runsInWidget) {
    try {
      const savedConfig = loadConfig()
      if (!savedConfig) {
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
    await runSetup()
  }
}

await main()
