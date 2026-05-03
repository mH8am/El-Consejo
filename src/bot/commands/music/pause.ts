import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.playing) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (player.paused) {
    await interaction.reply({ embeds: [errorEmbed('Already paused. Use `/resume` to continue.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await player.pause();
  await interaction.reply({ embeds: [successEmbed('Paused', `Paused **${player.queue.current?.info.title ?? 'Unknown'}**`)] });
}
