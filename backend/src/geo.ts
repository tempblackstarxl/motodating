// Пошук населених пунктів України через Photon (геокодер на базі OpenStreetMap).
// Photon заточений під автодоповнення (typeahead), безкоштовний, повертає
// локальні (українські) назви та координати.

const PHOTON = "https://photon.komoot.io";
// Прямокутник України (minLon, minLat, maxLon, maxLat) — щоб не ловити закордон.
const UA_BBOX = "22.0,44.0,40.3,52.5";
const PLACE_TYPES = new Set(["city", "town", "village", "hamlet"]);

export interface Settlement {
  name: string;
  region: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    countrycode?: string;
    osm_key?: string;
    osm_value?: string;
    state?: string;
    county?: string;
  };
}

function mapFeatures(features: PhotonFeature[]): Settlement[] {
  const out: Settlement[] = [];
  const seen = new Set<string>();
  for (const f of features) {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    if (!p.name || !coords) continue;
    if (p.countrycode !== "UA") continue;
    if (p.osm_key !== "place" || !PLACE_TYPES.has(p.osm_value ?? "")) continue;

    const region = [p.county, p.state].filter(Boolean).join(", ");
    const key = `${p.name}|${region}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ name: p.name, region, lat: coords[1], lng: coords[0] });
  }
  return out;
}

async function fetchPhoton(url: string): Promise<PhotonFeature[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MotoDating/0.1 (dating mini app)" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return data.features ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchSettlements(query: string, limit = 8): Promise<Settlement[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=${limit * 3}&bbox=${UA_BBOX}&osm_tag=place`;
  return mapFeatures(await fetchPhoton(url)).slice(0, limit);
}

export async function reverseSettlement(lat: number, lng: number): Promise<Settlement | null> {
  const url = `${PHOTON}/reverse/?lat=${lat}&lon=${lng}&limit=5&osm_tag=place`;
  const list = mapFeatures(await fetchPhoton(url));
  return list[0] ?? null;
}
