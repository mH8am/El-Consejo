import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffle the song queue');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.playing) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (player.queue.tracks.length < 2) {
    await interaction.reply({ embeds: [errorEmbed('Need at least **2 songs** in the queue to shuffle.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await player.queue.shuffle();
  await interaction.reply({ embeds: [successEmbed('Shuffled', `Shuffled **${player.queue.tracks.length}** queued tracks.`)] });
}
