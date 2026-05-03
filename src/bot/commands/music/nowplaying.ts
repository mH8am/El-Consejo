import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show the currently playing track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const track = queue.currentTrack!;
  const progress = queue.node.createProgressBar() ?? '';

  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('Now Playing')
    .setDescription(`[${track.title}](${track.url})`)
    .addFields(
      { name: 'Artist', value: track.author || 'Unknown', inline: true },
      { name: 'Duration', value: track.duration, inline: true },
      { name: 'Source', value: track.source, inline: true },
    )
    .setThumbnail(track.thumbnail)
    .setFooter({ text: progress })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
