import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the player, clear the queue, and disconnect');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.playing && !player?.paused) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await player.destroy();
  await interaction.reply({ embeds: [successEmbed('Stopped', 'Stopped playback and cleared the queue.')] });
}
