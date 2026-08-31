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
// Sugerencia de tamaño: con la fila de 4 jugadores agregada, el widget
// "Mediano" puede sentirse apretado — si se ve muy comprimido, prueba con
// el tamaño "Grande" al agregarlo a tu pantalla de inicio.

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

// Anillo de color fino alrededor de una foto circular — la foto ocupa casi
// todo el círculo, dejando solo un marco delgado del color visible.
function addRingedPhoto(parentStack, photoImg, ringColor, ringSize, photoSize) {
  const ringStack = parentStack.addStack()
  ringStack.size = new Size(ringSize, ringSize)
  ringStack.backgroundColor = new Color(ringColor)
  ringStack.cornerRadius = ringSize / 2
  ringStack.centerAlignContent()

  if (photoImg) {
    const inner = ringStack.addImage(photoImg)
    inner.imageSize = new Size(photoSize, photoSize)
    inner.cornerRadius = photoSize / 2
  }
}

// Escala de 5 colores según el % de puntos esperados (proyección) que ya
// completó el jugador: 0-15% rojo, 16-50% naranja, 51-90% amarillo,
// 91-100% verde, más de 100% azul.
function ringColorFor(actual, projected) {
  if (!projected || projected <= 0) return COLOR_TRACK
  const pct = (actual / projected) * 100
  if (pct <= 15) return COLOR_TIER_RED
  if (pct <= 50) return COLOR_TIER_ORANGE
  if (pct <= 90) return COLOR_TIER_YELLOW
  if (pct <= 100) return COLOR_TIER_GREEN
  return COLOR_TIER_BLUE
}

// Encuentra, dentro de los titulares, el primer jugador de la posición dada
// (ej. "QB" -> tu QB1 titular).
function findStarterByPosition(starterIds, playerInfoMap, position) {
  return starterIds.find(id => playerInfoMap && playerInfoMap[id] && playerInfoMap[id].position === position) || null
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

    const oppMatchup = matchups.find(m =>
      m.matchup_id === myMatchup.matchup_id && m.roster_id !== config.rosterId
    )

    const wins = (myRoster && myRoster.settings && myRoster.settings.wins) || 0
    const losses = (myRoster && myRoster.settings && myRoster.settings.losses) || 0
    const ties = (myRoster && myRoster.settings && myRoster.settings.ties) || 0
    const recordStr = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`

    // Probabilidad de ganar: para cada titular, puntos reales si ya jugó,
    // proyección si no — sumado por equipo da un "total esperado" preciso
    // desde el jueves, que se afina solo conforme la gente juega.
    function expectedTeamTotal(matchup) {
      const starters = matchup.starters || []
      const actualByPlayer = matchup.players_points || {}
      let total = 0
      for (const playerId of starters) {
        if (!playerId || playerId === "0") continue
        const actual = actualByPlayer[playerId]
        const projected = projections[playerId] || 0
        total += (actual && actual > 0) ? actual : projected
      }
      return total
    }

    const myExpected = expectedTeamTotal(myMatchup)
    const oppExpected = oppMatchup ? expectedTeamTotal(oppMatchup) : 0
    const expectedTotal = myExpected + oppExpected
    const prob = expectedTotal > 0 ? myExpected / expectedTotal : 0.5
    const probPctStr = (prob * 100).toFixed(1)

    // ---------- Fila 1: avatar + nombre del equipo + récord (esquina) ----------
    const topRow = widget.addStack()
    topRow.layoutHorizontally()
    topRow.centerAlignContent()

    if (config.avatarUrl) {
      try {
        const avatarImg = await getImage(config.avatarUrl)
        const avatarSize = 30
        const avatarElement = topRow.addImage(avatarImg)
        avatarElement.imageSize = new Size(avatarSize, avatarSize)
        avatarElement.cornerRadius = avatarSize / 2
        topRow.addSpacer(8)
      } catch (e) {
        // Si falla la descarga del avatar, seguimos sin él
      }
    }

    const nameText = topRow.addText(config.teamName)
    nameText.font = Font.heavySystemFont(16)
    nameText.textColor = new Color(COLOR_WHITE)
    nameText.lineLimit = 1

    topRow.addSpacer()

    const recordText = topRow.addText(recordStr)
    recordText.font = Font.boldSystemFont(15)
    recordText.textColor = new Color(COLOR_ACCENT)

    widget.addSpacer(8)

    // ---------- Fila 2: % de ganar + barra ----------
    const probRow = widget.addStack()
    probRow.layoutHorizontally()
    probRow.centerAlignContent()

    const probLabel = probRow.addText(`${probPctStr}% `)
    probLabel.font = Font.boldSystemFont(13)
    probLabel.textColor = new Color(COLOR_ACCENT)

    const winLabel = probRow.addText("WIN")
    winLabel.font = Font.boldSystemFont(11)
    winLabel.textColor = new Color(COLOR_MUTED)

    probRow.addSpacer(8)

    const barWidth = 130
    const barHeight = 7
    const barStack = probRow.addStack()
    barStack.size = new Size(barWidth, barHeight)
    barStack.layoutHorizontally()
    barStack.cornerRadius = 4

    const filledWidth = Math.round(barWidth * prob)
    const emptyWidth = barWidth - filledWidth

    if (filledWidth > 0) {
      const filledPart = barStack.addStack()
      filledPart.size = new Size(filledWidth, barHeight)
      filledPart.backgroundColor = new Color(COLOR_ACCENT)
    }
    if (emptyWidth > 0) {
      const emptyPart = barStack.addStack()
      emptyPart.size = new Size(emptyWidth, barHeight)
      emptyPart.backgroundColor = new Color(COLOR_TRACK)
    }

    widget.addSpacer(10)

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
        const posLabel = col.addText(position)
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

        addRingedPhoto(col, photoImg, ringColor, 52, 42)

        col.addSpacer(3)
        const posLabel = col.addText(position)
        posLabel.font = Font.boldSystemFont(9)
        posLabel.textColor = new Color(COLOR_MUTED)

        const ptsLabel = col.addText(`${actual.toFixed(1)}/${projected.toFixed(1)}`)
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
