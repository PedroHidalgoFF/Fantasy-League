// lib/news.js
// Trae noticias del feed RSS público de ESPN NFL y las filtra para mostrar
// solo las que mencionan a jugadores que están en los rosters de tu liga.
//
// Nota de atribución: ESPN pide que si usas su RSS, enlaces al artículo
// completo en espn.com y dejes claro que el contenido viene de ellos.
// Por eso mostramos solo título + resumen corto + link, nunca el artículo completo.

const ESPN_NFL_RSS = "https://www.espn.com/espn/rss/nfl/news";

// Parser simple de RSS con regex (evita meter una dependencia extra de XML).
// Funciona bien para el formato estándar de <item> de ESPN.
function parseRSSItems(xml) {
  const items = [];
  const itemBlocks = xml.split("<item>").slice(1);

  for (const block of itemBlocks) {
    const getTag = (tag) => {
      const match = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"));
      if (!match) return "";
      return match[1]
        .replace(/<!\[CDATA\[(.*?)\]\]>/s, "$1")
        .trim();
    };

    items.push({
      title: getTag("title"),
      link: getTag("link"),
      pubDate: getTag("pubDate"),
      description: getTag("description"),
    });
  }

  return items;
}

export async function getESPNNews() {
  const res = await fetch(ESPN_NFL_RSS, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Error al traer RSS de ESPN (${res.status})`);
  }
  const xml = await res.text();
  return parseRSSItems(xml);
}

// A partir de los rosters de la liga, saca la lista de apellidos de jugadores
// para poder filtrar noticias relevantes.
export function getLeaguePlayerLastNames(rosters, players) {
  const lastNames = new Set();

  for (const roster of rosters) {
    for (const playerId of roster.players || []) {
      const p = players[playerId];
      if (p?.last_name) {
        lastNames.add(p.last_name.toLowerCase());
      }
    }
  }

  return lastNames;
}

// Filtra noticias que mencionen (por título o descripción) a algún jugador
// de tu liga. Usa apellido porque es más confiable que nombre completo.
export function filterNewsForLeague(newsItems, lastNamesSet) {
  return newsItems.filter((item) => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    for (const lastName of lastNamesSet) {
      // Evita falsos positivos con apellidos muy cortos/comunes (ej. "lee")
      if (lastName.length < 4) continue;
      const regex = new RegExp(`\\b${lastName}\\b`, "i");
      if (regex.test(text)) return true;
    }
    return false;
  });
}
