import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (queue.node.isPaused()) {
    await interaction.reply({ embeds: [errorEmbed('Already paused. Use `/resume` to continue.')], flags: MessageFlags.Ephemeral });
    return;
  }

  queue.node.pause();
  await interaction.reply({ embeds: [successEmbed('Paused', `Paused **${queue.currentTrack!.title}**`)] });
}
