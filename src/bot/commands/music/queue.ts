import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Track } from 'lavalink-client';
import { lavalink, formatDuration } from '../../../services/lavalinkManager';
import { errorEmbed, infoEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current song queue');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.queue.current) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const current = player.queue.current as Track;
  const upcoming = (player.queue.tracks as Track[]).slice(0, 10);
  const total = player.queue.tracks.length;

  let description = `**Now Playing:**\n[${current.info.title}](${current.info.uri}) • \`${formatDuration(current.info.duration ?? 0)}\`\n`;

  if (upcoming.length > 0) {
    description += `\n**Up Next:**\n`;
    description += upcoming
      .map((t, i) => `\`${i + 1}.\` [${t.info.title}](${t.info.uri}) • \`${formatDuration(t.info.duration ?? 0)}\``)
      .join('\n');
    if (total > 10) description += `\n\n*...and ${total - 10} more tracks*`;
  } else {
    description += '\n*Queue is empty after this track.*';
  }

  await interaction.reply({
    embeds: [infoEmbed(`Queue — ${total + 1} track${total + 1 === 1 ? '' : 's'}`, description)],
  });
}
