import axios, { AxiosError } from 'axios';
import { LadderEntry, RiotRankedEntry, TrackedPlayer } from '../typings/index';
import { log } from '../utils/logger';

const BASE_URL = () => `https://${process.env.REGION ?? 'na1'}.api.riotgames.com`;
const HEADERS = () => ({ 'X-Riot-Token': process.env.RIOT_API_KEY ?? '' });

// ── TTL cache ────────────────────────────────────────────────────────────────
interface CacheEntry { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

// ── 429 backoff ──────────────────────────────────────────────────────────────
async function riotGet<T>(url: string, retries = 2): Promise<T> {
  try {
    const res = await axios.get<T>(url, { headers: HEADERS(), timeout: 8000 });
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 429 && retries > 0) {
      const retryAfter = parseInt(String(axiosErr.response.headers['retry-after'] ?? '1'), 10);
      log('warn', `Riot API rate limited — retrying in ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return riotGet<T>(url, retries - 1);
    }
    throw err;
  }
}

// Maps platform region to the regional routing cluster used by Account-v1
function getRegionalCluster(): string {
  const region = (process.env.REGION ?? 'na1').toLowerCase();
  if (['na1', 'br1', 'la1', 'la2'].includes(region)) return 'americas';
  if (['euw1', 'eun1', 'tr1', 'ru'].includes(region)) return 'europe';
  if (['kr', 'jp1'].includes(region)) return 'asia';
  return 'sea';
}

// Resolve a display name (gameName#tagLine) from a PUUID via Account-v1
async function getAccountByPuuid(puuid: string): Promise<string> {
  const key = `account-name:${puuid}`;
  try {
    const account = await cached(key, 10 * 60_000, () =>
      riotGet<{ gameName: string; tagLine: string }>(
        `https://${getRegionalCluster()}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`
      )
    );
    return `${account.gameName}#${account.tagLine}`;
  } catch {
    return 'Unknown';
  }
}

// Pick the best available display name for a league entry
async function resolveDisplayName(e: RiotRankedEntry): Promise<string> {
  if (e.summonerName) return e.summonerName;
  if (e.puuid) return getAccountByPuuid(e.puuid);
  return 'Unknown';
}

// Lookup by Riot ID (gameName#tagLine) using Account-v1 → PUUID → Summoner-v4 (for level)
export async function getSummonerByRiotId(
  gameName: string,
  tagLine: string
): Promise<{ puuid: string; name: string; summonerLevel: number } | null> {
  const key = `account:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`;
  try {
    return await cached(key, 10 * 60_000, async () => {
      const cluster = getRegionalCluster();
      const account = await riotGet<{ puuid: string; gameName: string; tagLine: string }>(
        `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
      );
      const summoner = await riotGet<{ summonerLevel: number }>(
        `${BASE_URL()}/lol/summoner/v4/summoners/by-puuid/${account.puuid}`
      );
      return {
        puuid: account.puuid,
        name: `${account.gameName}#${account.tagLine}`,
        summonerLevel: summoner.summonerLevel ?? 0,
      };
    });
  } catch (err) {
    log('error', `getSummonerByRiotId failed: ${(err as Error).message}`);
    return null;
  }
}

export async function getRankedEntries(puuid: string): Promise<RiotRankedEntry[]> {
  const key = `ranked:${puuid}`;
  try {
    return await cached(key, 3 * 60_000, () =>
      riotGet<RiotRankedEntry[]>(`${BASE_URL()}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`)
    );
  } catch (err) {
    log('error', `getRankedEntries failed: ${(err as Error).message}`);
    return [];
  }
}

export async function getChallengerLadder(): Promise<LadderEntry[]> {
  try {
    return await cached('ladder:challenger', 5 * 60_000, async () => {
      const data = await riotGet<{ entries: RiotRankedEntry[] }>(
        `${BASE_URL()}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
      );
      const top10 = data.entries
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
        .slice(0, 10);
      return Promise.all(
        top10.map(async (e) => ({ ...e, tier: 'CHALLENGER', displayName: await resolveDisplayName(e) }))
      );
    });
  } catch (err) {
    log('error', `getChallengerLadder failed: ${(err as Error).message}`);
    return [];
  }
}

export async function getGrandmasterLadder(): Promise<LadderEntry[]> {
  try {
    return await cached('ladder:grandmaster', 5 * 60_000, async () => {
      const data = await riotGet<{ entries: RiotRankedEntry[] }>(
        `${BASE_URL()}/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5`
      );
      const top10 = data.entries
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
        .slice(0, 10);
      return Promise.all(
        top10.map(async (e) => ({ ...e, tier: 'GRANDMASTER', displayName: await resolveDisplayName(e) }))
      );
    });
  } catch (err) {
    log('error', `getGrandmasterLadder failed: ${(err as Error).message}`);
    return [];
  }
}

// Requires Riot ID format: "GameName#Tag" (e.g. Faker#KR1)
export async function getFullProfile(input: string): Promise<TrackedPlayer | null> {
  if (!input.includes('#')) return null;

  const hashIndex = input.indexOf('#');
  const gameName = input.slice(0, hashIndex).trim();
  const tagLine = input.slice(hashIndex + 1).trim();

  if (!gameName || !tagLine) return null;

  const summoner = await getSummonerByRiotId(gameName, tagLine);
  if (!summoner) return null;

  const entries = await getRankedEntries(summoner.puuid);
  const rankedSolo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');

  return {
    summonerName: summoner.name,
    puuid: summoner.puuid,
    summonerLevel: summoner.summonerLevel,
    tier: rankedSolo?.tier ?? 'UNRANKED',
    rank: rankedSolo?.rank ?? '',
    lp: rankedSolo?.leaguePoints ?? 0,
    wins: rankedSolo?.wins ?? 0,
    losses: rankedSolo?.losses ?? 0,
  };
}
