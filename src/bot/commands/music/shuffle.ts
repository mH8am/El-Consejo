import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffle the song queue');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (queue.tracks.size < 2) {
    await interaction.reply({ embeds: [errorEmbed('Need at least **2 songs** in the queue to shuffle.')], flags: MessageFlags.Ephemeral });
    return;
  }

  queue.tracks.shuffle();
  await interaction.reply({ embeds: [successEmbed('Shuffled', `Shuffled **${queue.tracks.size}** queued tracks.`)] });
}
