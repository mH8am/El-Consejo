import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Resume the paused track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is in the queue.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (!player.paused) {
    await interaction.reply({ embeds: [errorEmbed('Not paused. Use `/pause` to pause.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await player.resume();
  await interaction.reply({ embeds: [successEmbed('Resumed', `Resumed **${player.queue.current?.info.title ?? 'Unknown'}**`)] });
}
