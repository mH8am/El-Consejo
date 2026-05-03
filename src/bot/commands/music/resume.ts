import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the paused track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is in the queue.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (!queue.node.isPaused()) {
    await interaction.reply({ embeds: [errorEmbed('Not paused. Use `/pause` to pause.')], flags: MessageFlags.Ephemeral });
    return;
  }

  queue.node.resume();
  await interaction.reply({ embeds: [successEmbed('Resumed', `Resumed **${queue.currentTrack!.title}**`)] });
}
