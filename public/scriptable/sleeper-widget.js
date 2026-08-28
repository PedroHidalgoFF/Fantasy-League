// Sleeper Fantasy Football — Widget de puntuación en vivo
// Uso: 1) Corre este script UNA VEZ dentro de la app Scriptable (no como widget)
//         para elegir tu liga y equipo.
//      2) Luego agrega el widget a tu pantalla de inicio y selecciona este script.
//
// Datos: usa la API pública de Sleeper (no requiere login ni API key).
// Colores: alineados a los design tokens de la web app (fantasy-partner).

const CONFIG_KEY = "sleeperWidgetConfig"
const SEASON = "2026" // temporada NFL actual

// ---------- Paleta (tokens de la web app) ----------
const COLOR_BG = "#0d0d0d"        // --sidebar-bg
const COLOR_ACCENT = "#6fbf1f"    // --accent
const COLOR_MUTED = "#9ca3af"     // --sidebar-text
const COLOR_TRACK = "#2a2c2a"     // --border-soft (dark mode) — fondo de la barra sin llenar
const COLOR_FAINT = "#4a4f47"     // tono extra-tenue, sin token directo en el sitio
const COLOR_WHITE = "#f1f1f1"     // --text (dark mode)

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

// Descarga una imagen y la cachea localmente (el avatar no cambia seguido,
// así que no hace falta bajarlo de nuevo en cada refresco del widget).
async function getImage(url) {
  const fm = FileManager.local()
  const fileName = "sleeper_avatar_" + Data.fromString(url).toBase64String().replace(/[\/+=]/g, "") + ".img"
  const path = fm.joinPath(fm.documentsDirectory(), fileName)

  if (fm.fileExists(path)) {
    return fm.readImage(path)
  }
  const req = new Request(url)
  const img = await req.loadImage()
  try { fm.writeImage(path, img) } catch (e) { /* si falla el cache, no pasa nada */ }
  return img
}

// Mapa de nombres SOLO para los jugadores de tu roster (se construye una vez
// durante la configuración, dentro de la app con memoria de sobra — el
// widget nunca descarga el catálogo completo de jugadores de la NFL).
async function buildNameMapForIds(ids) {
  const allPlayers = await getJSON("https://api.sleeper.app/v1/players/nfl")
  const nameMap = {}
  for (const id of ids) {
    const p = allPlayers[id]
    if (!p) { nameMap[id] = id; continue }
    nameMap[id] = p.position === "DEF" ? `${p.team} DEF` : `${p.first_name} ${p.last_name}`.trim()
  }
  return nameMap
}

function playerName(nameMap, id) {
  return (nameMap && nameMap[id]) ? nameMap[id] : id
}

function getWeekProgress() {
  try {
    const now = new Date()
    const etString = now.toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "numeric",
      hour12: false
    })
    const parts = etString.split(" ")
    const weekday = parts[0]
    const hour = parseInt(parts[1], 10)

    if (weekday === "Thu") return hour < 20 ? 0.05 : 0.15
    if (weekday === "Fri" || weekday === "Sat") return 0.15
    if (weekday === "Sun") {
      if (hour < 13) return 0.2
      if (hour < 16) return 0.45
      if (hour < 20) return 0.68
      return 0.82
    }
    if (weekday === "Mon") return hour < 20 ? 0.88 : 0.97
    return 1
  } catch (e) {
    return 1
  }
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

  const nameMap = await buildNameMapForIds(myRoster.players || [])

  const config = {
    username,
    userId: user.user_id,
    leagueId: league.league_id,
    leagueName: league.name,
    rosterId: myRoster.roster_id,
    teamName,
    avatarUrl,
    nameMap
  }
  saveConfig(config)

  const done = new Alert()
  done.title = "Listo ✅"
  done.message = `Configurado: ${teamName} en "${league.name}". Ahora agrega el widget a tu pantalla de inicio.`
  await done.present()
}

async function buildWidget(config) {
  const widget = new ListWidget()
  widget.backgroundColor = new Color(COLOR_BG)
  widget.url = "scriptable:///run/" + encodeURIComponent(Script.name())

  try {
    const state = await getState()
    const week = Math.max(1, state.week || 1)

    const [matchups, rosters] = await Promise.all([
      getMatchups(config.leagueId, week),
      getRosters(config.leagueId)
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

    const myPoints = myMatchup.points || 0
    const oppPoints = oppMatchup ? (oppMatchup.points || 0) : 0
    const diff = myPoints - oppPoints

    const weekProgress = getWeekProgress()
    const baseScale = 5
    const earlyWeekDamping = 40
    const scale = baseScale + (1 - weekProgress) * earlyWeekDamping
    const prob = 1 / (1 + Math.exp(-diff / scale))
    const probPctStr = (prob * 100).toFixed(1)

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

    // heavySystemFont es lo más cercano en iOS al peso de Oswald (fuente de
    // títulos de la web app, no disponible en Scriptable).
    const nameText = topRow.addText(config.teamName)
    nameText.font = Font.heavySystemFont(16)
    nameText.textColor = new Color(COLOR_WHITE)
    nameText.lineLimit = 1

    topRow.addSpacer()

    const totalText = topRow.addText(myPoints.toFixed(2))
    totalText.font = Font.mediumSystemFont(15)
    totalText.textColor = new Color(COLOR_ACCENT)

    widget.addSpacer(4)

    const recordText = widget.addText(recordStr)
    recordText.font = Font.mediumSystemFont(12)
    recordText.textColor = new Color(COLOR_ACCENT)

    const leagueText = widget.addText(config.leagueName)
    leagueText.font = Font.systemFont(10)
    leagueText.textColor = new Color(COLOR_MUTED)
    leagueText.lineLimit = 1

    widget.addSpacer(6)

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

    const redWidth = Math.round(barWidth * prob)
    const blueWidth = barWidth - redWidth

    if (redWidth > 0) {
      const redPart = barStack.addStack()
      redPart.size = new Size(redWidth, barHeight)
      redPart.backgroundColor = new Color(COLOR_ACCENT)
    }
    if (blueWidth > 0) {
      const bluePart = barStack.addStack()
      bluePart.size = new Size(blueWidth, barHeight)
      bluePart.backgroundColor = new Color(COLOR_TRACK)
    }

    const starters = myMatchup.starters || []
    const starterPoints = myMatchup.starters_points || []
    if (starters.length > 0) {
      let topIdx = 0
      for (let i = 1; i < starters.length; i++) {
        if ((starterPoints[i] || 0) > (starterPoints[topIdx] || 0)) topIdx = i
      }
      const topName = playerName(config.nameMap, starters[topIdx])
      const topPts = (starterPoints[topIdx] || 0).toFixed(1)

      widget.addSpacer(6)
      const topScorerText = widget.addText(`⭐ ${topName} — ${topPts} pts`)
      topScorerText.font = Font.mediumSystemFont(11)
      topScorerText.textColor = new Color(COLOR_ACCENT)
      topScorerText.lineLimit = 1
    }

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
