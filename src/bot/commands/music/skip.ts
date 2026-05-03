import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.playing) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const title = player.queue.current?.info.title ?? 'Unknown';
  await player.skip();
  await interaction.reply({ embeds: [successEmbed('Skipped', `Skipped **${title}**`)] });
}
