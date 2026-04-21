import { Client, TextChannel } from 'discord.js';
import { TrackedPlayer } from '../typings/index';
import { getRankedEntries } from './riotApi';
import { lpGainEmbed, lpLossEmbed } from '../utils/embeds';
import { log } from '../utils/logger';

const trackedPlayers = new Map<string, TrackedPlayer>();
let pollInterval: NodeJS.Timeout | null = null;

export function addTrackedPlayer(player: TrackedPlayer): void {
  trackedPlayers.set(player.summonerName.toLowerCase(), player);
}

export function getTrackedPlayers(): TrackedPlayer[] {
  return Array.from(trackedPlayers.values());
}

export function removeTrackedPlayer(name: string): boolean {
  return trackedPlayers.delete(name.toLowerCase());
}

export function startLPTracker(client: Client): void {
  const intervalMs = (parseInt(process.env.POLL_INTERVAL_MINUTES ?? '5', 10)) * 60_000;
  const channelId = process.env.LP_CHANNEL_ID;

  if (!channelId) {
    log('warn', 'LP_CHANNEL_ID not set — LP tracker disabled.');
    return;
  }

  pollInterval = setInterval(async () => {
    const channel = client.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) return;

    for (const player of trackedPlayers.values()) {
      try {
        const entries = await getRankedEntries(player.puuid);
        const rankedSolo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
        if (!rankedSolo) continue;

        const newLp = rankedSolo.leaguePoints;
        const diff = newLp - player.lp;

        if (diff !== 0) {
          const updated: TrackedPlayer = {
            ...player,
            lp: newLp,
            wins: rankedSolo.wins,
            losses: rankedSolo.losses,
          };
          trackedPlayers.set(player.summonerName.toLowerCase(), updated);

          const embed = diff > 0 ? lpGainEmbed(updated, diff) : lpLossEmbed(updated, Math.abs(diff));
          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        log('error', `LP poll failed for ${player.summonerName}: ${(err as Error).message}`);
      }
    }
  }, intervalMs);

  log('info', `LP tracker started — polling every ${process.env.POLL_INTERVAL_MINUTES ?? 5} minutes.`);
}

export function stopLPTracker(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
