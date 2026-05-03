import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';
import { Track } from 'lavalink-client';
import { lavalink, formatDuration, buildProgressBar } from '../../../services/lavalinkManager';
import { errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show the currently playing track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.queue.current) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const track = player.queue.current as Track;
  const duration = track.info.duration ?? 0;
  const position = player.lastPosition ?? 0;

  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('Now Playing')
    .setDescription(`[${track.info.title}](${track.info.uri})`)
    .addFields(
      { name: 'Artist', value: track.info.author || 'Unknown', inline: true },
      { name: 'Duration', value: formatDuration(duration), inline: true },
      { name: 'Source', value: track.info.sourceName || 'Unknown', inline: true },
    )
    .setFooter({ text: buildProgressBar(position, duration) })
    .setTimestamp();

  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

  await interaction.reply({ embeds: [embed] });
}
