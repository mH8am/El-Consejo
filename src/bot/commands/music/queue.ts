import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, infoEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current song queue');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const current = queue.currentTrack!;
  const upcoming = queue.tracks.data.slice(0, 10);
  const total = queue.tracks.size;

  let description = `**Now Playing:**\n[${current.title}](${current.url}) • \`${current.duration}\`\n`;

  if (upcoming.length > 0) {
    description += `\n**Up Next:**\n`;
    description += upcoming
      .map((t, i) => `\`${i + 1}.\` [${t.title}](${t.url}) • \`${t.duration}\``)
      .join('\n');

    if (total > 10) description += `\n\n*...and ${total - 10} more tracks*`;
  } else {
    description += '\n*Queue is empty after this track.*';
  }

  await interaction.reply({
    embeds: [infoEmbed(`Queue — ${total + 1} track${total + 1 === 1 ? '' : 's'}`, description)],
  });
}
