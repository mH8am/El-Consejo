import { Player, GuildQueue } from 'discord-player';
import { DefaultExtractors, SpotifyExtractor } from '@discord-player/extractor';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { TextChannel } from 'discord.js';
import ffmpegPath from 'ffmpeg-static';
import { CustomClient } from '../bot/structures/CustomClient';
import { log } from '../utils/logger';
import { infoEmbed, errorEmbed } from '../utils/embeds';

export interface MusicMetadata {
  channel: TextChannel;
}

export async function initMusicPlayer(client: CustomClient): Promise<void> {
  const player = new Player(client, {
    // Explicitly point to the bundled ffmpeg binary so it's never "not found"
    ffmpegPath: ffmpegPath ?? undefined,
  });

  // YouTube extractor — TV_EMBEDDED client bypasses signature/n-function decipher requirements
  await player.extractors.register(YoutubeiExtractor, {
    streamOptions: { useClient: 'TV_EMBEDDED' },
  });

  // SoundCloud, Vimeo, Spotify fallback, Apple Music, etc.
  await player.extractors.loadMulti(DefaultExtractors);

  // Override Spotify extractor with API credentials if provided for better playlist support
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    await player.extractors.register(SpotifyExtractor, {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  player.events.on('playerStart', (queue: GuildQueue<MusicMetadata>, track) => {
    queue.metadata?.channel.send({
      embeds: [infoEmbed('Now Playing', `[${track.title}](${track.url})\nby **${track.author}** • \`${track.duration}\``)],
    }).catch(() => {});
  });

  player.events.on('playerError', (queue: GuildQueue<MusicMetadata>, error, track) => {
    log('error', `Player stream error [${track.title}]: ${error.message}`);
    queue.metadata?.channel.send({
      embeds: [errorEmbed(`Failed to play **${track.title}**: ${error.message}`)],
    }).catch(() => {});
  });

  player.events.on('emptyQueue', (queue: GuildQueue<MusicMetadata>) => {
    queue.metadata?.channel.send({
      embeds: [infoEmbed('Queue Empty', 'All tracks have been played.')],
    }).catch(() => {});
  });

  player.events.on('disconnect', (queue: GuildQueue<MusicMetadata>) => {
    queue.metadata?.channel.send({
      embeds: [infoEmbed('Disconnected', 'Left the voice channel.')],
    }).catch(() => {});
  });

  player.events.on('error', (queue: GuildQueue<MusicMetadata>, error) => {
    log('error', `Music error in guild ${queue.guild.id}: ${error.message}`);
    queue.metadata?.channel.send({
      embeds: [errorEmbed(`Player error: ${error.message}`)],
    }).catch(() => {});
  });

  log('info', `Music player initialized (ffmpeg: ${ffmpegPath ?? 'system'})`);
}
