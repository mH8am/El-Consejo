import { LavalinkManager, Track } from 'lavalink-client';
import { TextChannel } from 'discord.js';
import { CustomClient } from '../bot/structures/CustomClient';
import { log } from '../utils/logger';
import { infoEmbed, errorEmbed } from '../utils/embeds';

export let lavalink: LavalinkManager;

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

export function buildProgressBar(position: number, duration: number, length = 20): string {
  if (!duration) return '';
  const filled = Math.round((position / duration) * length);
  const bar = '▬'.repeat(filled) + '🔘' + '▬'.repeat(Math.max(0, length - filled - 1));
  return `${bar}\n\`${formatDuration(position)} / ${formatDuration(duration)}\``;
}

function sendToChannel(client: CustomClient, channelId: string | null | undefined, content: Parameters<TextChannel['send']>[0]) {
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (channel?.isTextBased() && 'send' in channel) {
    (channel as TextChannel).send(content).catch(() => {});
  }
}

export function initLavalinkManager(client: CustomClient): void {
  lavalink = new LavalinkManager({
    nodes: [{
      host: process.env.LAVALINK_HOST ?? 'localhost',
      port: Number(process.env.LAVALINK_PORT ?? 2333),
      authorization: process.env.LAVALINK_PASSWORD ?? 'youshallnotpass',
      secure: process.env.LAVALINK_SECURE === 'true',
      id: 'main',
      retryAmount: 10,
      retryDelay: 5_000,
    }],
    sendToShard: (guildId, payload) => {
      client.guilds.cache.get(guildId)?.shard?.send(payload);
    },
    autoSkip: true,
    client: {
      id: process.env.CLIENT_ID!,
      username: 'El-Consejo',
    },
    playerOptions: {
      defaultSearchPlatform: 'ytsearch',
      volumeDecrementer: 0.75,
      onDisconnect: {
        autoReconnect: false,
        destroyPlayer: true,
      },
      onEmptyQueue: {
        destroyAfterMs: 30_000,
      },
    },
  });

  client.on('raw', (d) => lavalink.sendRawData(d));

  lavalink.nodeManager.on('connect', (node) => {
    log('info', `Lavalink node "${node.id}" connected`);
  });

  lavalink.nodeManager.on('error', (node, error) => {
    log('error', `Lavalink node "${node.id}" error: ${error.message}`);
  });

  lavalink.nodeManager.on('disconnect', (node, reason) => {
    log('warn', `Lavalink node "${node.id}" disconnected: ${JSON.stringify(reason)}`);
  });

  lavalink.on('trackStart', (player, track) => {
    const t = track as Track;
    sendToChannel(client, player.textChannelId, {
      embeds: [infoEmbed(
        'Now Playing',
        `[${t.info.title}](${t.info.uri})\nby **${t.info.author}** • \`${formatDuration(t.info.duration ?? 0)}\``,
      )],
    });
  });

  lavalink.on('queueEnd', (player) => {
    sendToChannel(client, player.textChannelId, {
      embeds: [infoEmbed('Queue Empty', 'All tracks have been played.')],
    });
  });

  lavalink.on('trackError', (player, track, payload) => {
    const msg = (payload as any).exception?.message ?? 'Unknown error';
    const title = (track as Track | null)?.info.title ?? 'Unknown';
    log('error', `Track error [${title}]: ${msg}`);
    sendToChannel(client, player.textChannelId, {
      embeds: [errorEmbed(`Failed to play **${title}**: ${msg}`)],
    });
  });
}
